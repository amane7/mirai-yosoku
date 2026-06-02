import type {
  CausalEdge,
  Factor,
  FactorScores,
  KnockoutState,
  Project,
  SubFactor,
  FactorDimensionKey,
  FcsContribution,
  DimensionSensitivity,
} from './types';
import { DIMENSION_META } from './types';

// ============================================================================
// Future Nexus OS — グラフ分析エンジン
// 中心媒介性 / 影響伝播 / ノックアウト / Future Criticality Score
// （NetworkX相当のロジックを純TypeScriptで実装）
// ============================================================================

type AdjList = Map<string, { to: string; w: number }[]>;

function buildAdj(nodes: Factor[], edges: CausalEdge[], directed = true): AdjList {
  const adj: AdjList = new Map();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    adj.get(e.source)?.push({ to: e.target, w: e.weight });
    if (!directed) adj.get(e.target)?.push({ to: e.source, w: e.weight });
  });
  return adj;
}

// ----- サブ因子のロールアップ（細分化分析の基礎） -----

const DIM_KEYS: FactorDimensionKey[] = [
  'maturity',
  'uncertainty',
  'substitutability',
  'controllability',
  'evidenceScore',
];

/**
 * サブ因子を持つ因子の5指標を、weight 加重平均でロールアップする。
 * サブ因子が無ければそのまま返す。これにより「粒度を細かくしても、
 * 上位の因果ネットワーク計算は一貫したまま」になる。
 */
export function rolledUpFactor(f: Factor): Factor {
  const subs = f.subFactors;
  if (!subs || subs.length === 0) return f;
  const totalW = subs.reduce((a, s) => a + Math.max(0, s.weight), 0);
  if (totalW <= 1e-9) return f;
  const agg: Record<FactorDimensionKey, number> = {
    maturity: 0,
    uncertainty: 0,
    substitutability: 0,
    controllability: 0,
    evidenceScore: 0,
  };
  for (const s of subs) {
    const w = Math.max(0, s.weight) / totalW;
    DIM_KEYS.forEach((k) => (agg[k] += (s[k] ?? 0) * w));
  }
  return { ...f, ...agg };
}

/** プロジェクト全因子をロールアップしたコピーを返す（元データは不変） */
export function withRolledUpFactors(project: Project): Project {
  return { ...project, factors: project.factors.map(rolledUpFactor) };
}

/**
 * Brandes' algorithm（重みなし最短経路ベース）で媒介中心性を計算。
 * 因果ネットワークの「橋渡し度」を測る。
 */
export function betweennessCentrality(
  nodes: Factor[],
  edges: CausalEdge[],
): Record<string, number> {
  const adj = buildAdj(nodes, edges, true);
  const cb: Record<string, number> = {};
  nodes.forEach((n) => (cb[n.id] = 0));

  for (const s of nodes) {
    const stack: string[] = [];
    const pred: Record<string, string[]> = {};
    const sigma: Record<string, number> = {};
    const dist: Record<string, number> = {};
    nodes.forEach((n) => {
      pred[n.id] = [];
      sigma[n.id] = 0;
      dist[n.id] = -1;
    });
    sigma[s.id] = 1;
    dist[s.id] = 0;
    const queue: string[] = [s.id];
    while (queue.length) {
      const v = queue.shift()!;
      stack.push(v);
      for (const { to: w } of adj.get(v) ?? []) {
        if (dist[w] < 0) {
          queue.push(w);
          dist[w] = dist[v] + 1;
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      }
    }
    const delta: Record<string, number> = {};
    nodes.forEach((n) => (delta[n.id] = 0));
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of pred[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s.id) cb[w] += delta[w];
    }
  }

  // 正規化 (有向: (n-1)(n-2))
  const n = nodes.length;
  const norm = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1;
  let max = 0;
  Object.keys(cb).forEach((k) => {
    cb[k] *= norm;
    max = Math.max(max, cb[k]);
  });
  // 0-1スケール（相対）
  if (max > 0) Object.keys(cb).forEach((k) => (cb[k] = cb[k] / max));
  return cb;
}

/** 直接影響度: 出ていくエッジの重み合計（正規化） */
export function directInfluence(
  nodes: Factor[],
  edges: CausalEdge[],
): Record<string, number> {
  const out: Record<string, number> = {};
  nodes.forEach((n) => (out[n.id] = 0));
  edges.forEach((e) => (out[e.source] += e.weight));
  const max = Math.max(1e-9, ...Object.values(out));
  Object.keys(out).forEach((k) => (out[k] /= max));
  return out;
}

/**
 * 影響伝播シミュレーション。
 * 起点ノードに刺激を与え、減衰しながら下流へ伝播させる（活性化拡散）。
 * knockout を反映した「実効重み」で計算する。
 */
export function propagate(
  nodes: Factor[],
  edges: CausalEdge[],
  seeds: Record<string, number>,
  knockout?: KnockoutState,
  steps = 6,
  decay = 0.78,
): Record<string, number> {
  const activation: Record<string, number> = {};
  nodes.forEach((n) => (activation[n.id] = seeds[n.id] ?? 0));

  // ノックアウトでノード自体が弱まる
  const nodeStrength = (id: string) =>
    knockout?.strength[id] !== undefined ? knockout.strength[id] : 1;

  const effectiveEdges = edges.map((e) => ({
    ...e,
    eff: e.weight * (e.direction === 'negative' ? -1 : 1),
  }));

  for (let s = 0; s < steps; s++) {
    const next: Record<string, number> = { ...activation };
    for (const e of effectiveEdges) {
      const srcAct = activation[e.source] * nodeStrength(e.source);
      const contribution = srcAct * e.eff * decay * nodeStrength(e.target);
      next[e.target] = clamp(next[e.target] + contribution * 0.5, -1, 2);
    }
    nodes.forEach((n) => (activation[n.id] = next[n.id]));
  }
  return activation;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * ノックアウト影響度: 各ノードを単独で0にしたときの、
 * ネットワーク全体の活性化総量の低下率。
 */
export function knockoutImpactAll(
  nodes: Factor[],
  edges: CausalEdge[],
): Record<string, number> {
  const seeds = baseSeeds(nodes, edges);
  const baseline = sum(Object.values(propagate(nodes, edges, seeds)));
  const result: Record<string, number> = {};
  for (const n of nodes) {
    const ko: KnockoutState = { strength: { [n.id]: 0 }, delay: {} };
    const after = sum(Object.values(propagate(nodes, edges, seeds, ko)));
    result[n.id] = baseline > 0 ? clamp((baseline - after) / baseline, 0, 1) : 0;
  }
  const max = Math.max(1e-9, ...Object.values(result));
  Object.keys(result).forEach((k) => (result[k] /= max));
  return result;
}

/** ルートノード（入次数0に近い）を起点とした標準的な刺激 */
function baseSeeds(nodes: Factor[], edges: CausalEdge[]): Record<string, number> {
  const inDeg: Record<string, number> = {};
  nodes.forEach((n) => (inDeg[n.id] = 0));
  edges.forEach((e) => (inDeg[e.target] += 1));
  const seeds: Record<string, number> = {};
  nodes.forEach((n) => {
    seeds[n.id] = inDeg[n.id] === 0 ? 1 : 0.15;
  });
  return seeds;
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

/** ボトルネック度: 入次数×媒介性。詰まると全体が止まる度合い。 */
export function bottleneckScore(
  nodes: Factor[],
  edges: CausalEdge[],
  betweenness: Record<string, number>,
): Record<string, number> {
  const inW: Record<string, number> = {};
  nodes.forEach((n) => (inW[n.id] = 0));
  edges.forEach((e) => (inW[e.target] += e.weight));
  const result: Record<string, number> = {};
  nodes.forEach((n) => {
    result[n.id] = betweenness[n.id] * 0.6 + Math.min(1, inW[n.id] / 2) * 0.4;
  });
  const max = Math.max(1e-9, ...Object.values(result));
  Object.keys(result).forEach((k) => (result[k] /= max));
  return result;
}

/** 時間重要度: ターゲット年に近いほど高い（0-1） */
function timeImportance(f: Factor, targetYear: number): number {
  const span = Math.max(1, f.timeEnd - f.timeStart);
  const fromPeak = Math.abs(targetYear - f.timePeak);
  return clamp(1 - fromPeak / span, 0.15, 1);
}

export interface ScoreResult {
  scores: Record<string, FactorScores>;
  ranking: { factor: Factor; scores: FactorScores }[];
}

// ----- FCSの因数分解（細分化分析の中核） -----

/** FCSを構成する乗算項を {label,value,color} の配列で返す。除算項は逆数で表現。 */
function fcsTerms(
  f: Factor,
  net: { bc: number; di: number; ki: number; ti: number },
): { key: string; label: string; value: number; color: string }[] {
  return [
    { key: 'betweenness', label: '中心媒介性', value: net.bc * 0.5 + 0.5, color: '#22d3ee' },
    { key: 'directInfluence', label: '直接影響度', value: net.di * 0.5 + 0.5, color: '#3b82f6' },
    { key: 'timeImportance', label: '時間重要度', value: net.ti, color: '#a3e635' },
    { key: 'knockoutImpact', label: 'ノックアウト影響', value: net.ki * 0.6 + 0.4, color: '#f59e0b' },
    { key: 'evidenceScore', label: '証拠強度', value: f.evidenceScore * 0.5 + 0.5, color: '#10b981' },
    {
      key: 'substitutability',
      label: '代替困難性',
      // FCSは ÷代替可能性。逆数を乗算項として扱う。
      value: 1 / Math.max(0.2, f.substitutability * 0.7 + 0.3),
      color: '#ec4899',
    },
  ];
}

function fcsFromTerms(terms: { value: number }[]): number {
  return terms.reduce((a, t) => a * t.value, 1);
}

/**
 * FCSを「対数空間での加法分解」によって各要素の寄与シェアに分けて返す。
 * FCS = Π term_i なので log(FCS) = Σ log(term_i)。
 * 1を基準にした log の絶対値で「どの要素がFCSを押し上げ/押し下げているか」を示す。
 */
export function fcsContributions(
  project: Project,
  factorId: string,
  targetYear?: number,
): { fcsRaw: number; contributions: FcsContribution[] } {
  const rolled = withRolledUpFactors(project);
  const { factors: nodes, edges } = rolled;
  const f = nodes.find((n) => n.id === factorId);
  if (!f) return { fcsRaw: 0, contributions: [] };
  const year = targetYear ?? project.scenarios[0]?.targetYear ?? project.horizonEnd;

  const bc = betweennessCentrality(nodes, edges);
  const di = directInfluence(nodes, edges);
  const ki = knockoutImpactAll(nodes, edges);
  const ti = timeImportance(f, year);

  const terms = fcsTerms(f, { bc: bc[f.id], di: di[f.id], ki: ki[f.id], ti });
  const fcsRaw = fcsFromTerms(terms);

  // log寄与（基準1）の絶対値でシェア化
  const logs = terms.map((t) => Math.abs(Math.log(Math.max(1e-6, t.value))));
  const totalLog = Math.max(1e-9, logs.reduce((a, b) => a + b, 0));
  const contributions: FcsContribution[] = terms.map((t, i) => ({
    key: t.key,
    label: t.label,
    value: t.value,
    share: logs[i] / totalLog,
    color: t.color,
  }));
  contributions.sort((a, b) => b.share - a.share);
  return { fcsRaw, contributions };
}

/**
 * 各ディメンション（成熟度/不確実性/代替可能性/操作可能性/証拠）を ±0.1 動かしたときの
 * FCSの相対変化を測る感応度分析。どの軸を磨けば急所性が最も動くかを示す。
 */
export function dimensionSensitivity(
  project: Project,
  factorId: string,
  targetYear?: number,
): DimensionSensitivity[] {
  const rolled = withRolledUpFactors(project);
  const baseFactor = rolled.factors.find((n) => n.id === factorId);
  if (!baseFactor) return [];
  const year = targetYear ?? project.scenarios[0]?.targetYear ?? project.horizonEnd;

  // ネットワーク由来の項は固定（1因子の指標変更は媒介性等に与える影響が小さいため近似固定）
  const { factors: nodes, edges } = rolled;
  const bc = betweennessCentrality(nodes, edges)[factorId];
  const di = directInfluence(nodes, edges)[factorId];
  const ki = knockoutImpactAll(nodes, edges)[factorId];
  const ti = timeImportance(baseFactor, year);

  const fcsOf = (f: Factor) => fcsFromTerms(fcsTerms(f, { bc, di, ki, ti }));
  const base = fcsOf(baseFactor);

  const dims: FactorDimensionKey[] = ['maturity', 'uncertainty', 'substitutability', 'controllability', 'evidenceScore'];
  const result: DimensionSensitivity[] = dims.map((k) => {
    const up: Factor = { ...baseFactor, [k]: clamp((baseFactor[k] as number) + 0.1, 0, 1) };
    const down: Factor = { ...baseFactor, [k]: clamp((baseFactor[k] as number) - 0.1, 0, 1) };
    const deltaUp = base > 1e-9 ? (fcsOf(up) - base) / base : 0;
    const deltaDown = base > 1e-9 ? (fcsOf(down) - base) / base : 0;
    return {
      key: k,
      label: DIMENSION_META[k].label,
      current: baseFactor[k] as number,
      deltaUp,
      deltaDown,
      magnitude: Math.abs(deltaUp) + Math.abs(deltaDown),
      favorable: DIMENSION_META[k].favorable,
    };
  });
  result.sort((a, b) => b.magnitude - a.magnitude);
  return result;
}

/** サブ因子の親因子への寄与シェア（weight正規化）と、各サブの簡易急所性を返す */
export interface SubFactorContribution {
  sub: SubFactor;
  weightShare: number;
  /** サブ因子単体のFCS的な指標（媒介性等は親に依存しないため指標のみで近似） */
  localScore: number;
}

export function subFactorBreakdown(f: Factor): SubFactorContribution[] {
  const subs = f.subFactors ?? [];
  const totalW = subs.reduce((a, s) => a + Math.max(0, s.weight), 0) || 1;
  return subs
    .map((sub) => {
      // 指標のみの簡易スコア（成熟・不確実・操作・証拠が高く、代替が低いほど高い）
      const localScore =
        ((sub.maturity * 0.5 + 0.5) *
          (sub.uncertainty * 0.4 + 0.6) *
          (sub.controllability * 0.4 + 0.6) *
          (sub.evidenceScore * 0.5 + 0.5)) /
        Math.max(0.2, sub.substitutability * 0.7 + 0.3);
      return {
        sub,
        weightShare: Math.max(0, sub.weight) / totalW,
        localScore,
      };
    })
    .sort((a, b) => b.weightShare * b.localScore - a.weightShare * a.localScore);
}

/**
 * 全因子のスコアを一括計算し、Future Criticality Score でランキング化。
 *
 * FCS = 媒介性 × 影響度 × 時間重要度 × ノックアウト影響度 × 証拠強度 ÷ 代替可能性
 */
export function computeScores(rawProject: Project, targetYear?: number): ScoreResult {
  // サブ因子があれば指標をロールアップしてから計算する（細分化に対応）
  const project = withRolledUpFactors(rawProject);
  const { factors: nodes, edges } = project;
  const year = targetYear ?? project.scenarios[0]?.targetYear ?? project.horizonEnd;

  const bc = betweennessCentrality(nodes, edges);
  const di = directInfluence(nodes, edges);
  const ki = knockoutImpactAll(nodes, edges);
  const bn = bottleneckScore(nodes, edges, bc);

  // 間接影響度: 影響伝播で各ノードを単独刺激したときの下流総量
  const indirect: Record<string, number> = {};
  nodes.forEach((n) => {
    const seed = { [n.id]: 1 };
    const prop = propagate(nodes, edges, seed, undefined, 5, 0.7);
    indirect[n.id] = sum(
      nodes.filter((m) => m.id !== n.id).map((m) => Math.abs(prop[m.id])),
    );
  });
  const indMax = Math.max(1e-9, ...Object.values(indirect));
  nodes.forEach((n) => (indirect[n.id] /= indMax));

  const scores: Record<string, FactorScores> = {};
  nodes.forEach((n) => {
    const ti = timeImportance(n, year);
    const fcsRaw = fcsFromTerms(fcsTerms(n, { bc: bc[n.id], di: di[n.id], ki: ki[n.id], ti }));
    scores[n.id] = {
      betweenness: bc[n.id],
      directInfluence: di[n.id],
      indirectInfluence: indirect[n.id],
      bottleneck: bn[n.id],
      knockoutImpact: ki[n.id],
      futureCriticality: fcsRaw,
    };
  });

  // FCS を 0-1 に正規化
  const fcsMax = Math.max(1e-9, ...nodes.map((n) => scores[n.id].futureCriticality));
  nodes.forEach((n) => (scores[n.id].futureCriticality /= fcsMax));

  const ranking = nodes
    .map((factor) => ({ factor, scores: scores[factor.id] }))
    .sort((a, b) => b.scores.futureCriticality - a.scores.futureCriticality);

  return { scores, ranking };
}

// ----- ノックアウト差分（シナリオ比較用） -----

export interface KnockoutDiff {
  factorId: string;
  name: string;
  baseline: number;
  after: number;
  deltaPct: number; // 低下率 (-=低下)
}

export function knockoutDiff(
  project: Project,
  knockout: KnockoutState,
): { diffs: KnockoutDiff[]; baselineTotal: number; afterTotal: number } {
  const { factors: nodes, edges } = project;
  const seeds = baseSeeds(nodes, edges);
  const base = propagate(nodes, edges, seeds);
  const after = propagate(nodes, edges, seeds, knockout);
  const diffs: KnockoutDiff[] = nodes.map((n) => {
    const b = base[n.id];
    const a = after[n.id];
    const deltaPct = Math.abs(b) > 1e-6 ? (a - b) / Math.abs(b) : 0;
    return { factorId: n.id, name: n.name, baseline: b, after: a, deltaPct };
  });
  return {
    diffs: diffs.sort((x, y) => x.deltaPct - y.deltaPct),
    baselineTotal: sum(Object.values(base)),
    afterTotal: sum(Object.values(after)),
  };
}

// ----- シナリオ比較 (C) -----

export interface ScenarioActivation {
  byId: Record<string, number>; // factorId -> 活性度
  total: number;
  delays: Record<string, number>; // factorId -> 遅延年数
}

/**
 * 与えられた介入(knockout)下での各因子の活性度・全体総量・遅延を計算する。
 * 並列シナリオ比較の基礎データ。knockout を省略するとベースライン。
 */
export function scenarioActivation(
  project: Project,
  knockout?: KnockoutState,
): ScenarioActivation {
  const { factors: nodes, edges } = project;
  const seeds = baseSeeds(nodes, edges);
  const act = propagate(nodes, edges, seeds, knockout);
  const byId: Record<string, number> = {};
  nodes.forEach((n) => (byId[n.id] = act[n.id]));
  const total = sum(Object.values(byId));
  const delays = knockout ? estimateDelays(project, knockout) : {};
  return { byId, total, delays };
}

/** 2シナリオの因子別差分（活性度ベース） */
export interface FactorCompare {
  factorId: string;
  name: string;
  category: import('./types').FactorCategory;
  a: number;
  b: number;
  delta: number; // b - a
  deltaPct: number; // (b-a)/|a|
  delayA: number;
  delayB: number;
}

export function compareScenarios(
  project: Project,
  koA: KnockoutState | undefined,
  koB: KnockoutState | undefined,
): { a: ScenarioActivation; b: ScenarioActivation; rows: FactorCompare[] } {
  const a = scenarioActivation(project, koA);
  const b = scenarioActivation(project, koB);
  const rows: FactorCompare[] = project.factors.map((f) => {
    const av = a.byId[f.id] ?? 0;
    const bv = b.byId[f.id] ?? 0;
    const delta = bv - av;
    const deltaPct = Math.abs(av) > 1e-6 ? delta / Math.abs(av) : 0;
    return {
      factorId: f.id,
      name: f.name,
      category: f.category,
      a: av,
      b: bv,
      delta,
      deltaPct,
      delayA: a.delays[f.id] ?? 0,
      delayB: b.delays[f.id] ?? 0,
    };
  });
  rows.sort((x, y) => x.delta - y.delta); // 悪化が大きい順
  return { a, b, rows };
}

// ----- ロードマップ（バックキャスティング）のIF評価 -----

export interface MilestoneHealth {
  year: number;
  /** 介入後の達成見込み 0-1（1=変わらず達成可能, 0=ほぼ崩壊） */
  feasibility: number;
  /** 想定スリップ年数（介入で後ろ倒し） */
  slipYears: number;
  status: 'ok' | 'risk' | 'lost';
  /** この時点で効く主要因子のうち、影響を受けたもの */
  affected: { id: string; name: string; before: number; after: number }[];
}

/**
 * 各マイルストーン年に「効いている因子」を時間窓で拾い、
 * knockout 適用前後の活性度からその時点の達成見込みとスリップを推定する。
 */
export function milestoneHealthUnder(
  project: Project,
  milestoneYears: number[],
  knockout: KnockoutState,
): Record<number, MilestoneHealth> {
  const { factors: nodes, edges } = project;
  const seeds = baseSeeds(nodes, edges);
  const base = propagate(nodes, edges, seeds);
  const after = propagate(nodes, edges, seeds, knockout);
  const delays = estimateDelays(project, knockout);

  const result: Record<number, MilestoneHealth> = {};
  for (const year of milestoneYears) {
    // その年に「重要化している」因子（timeStart<=year<=timeEnd か、ピークが近い）
    const relevant = nodes.filter(
      (f) => year >= f.timeStart - 1 && year <= f.timeEnd + 1,
    );
    const pool = relevant.length ? relevant : nodes;

    let beforeSum = 0;
    let afterSum = 0;
    const affected: MilestoneHealth['affected'] = [];
    let maxSlip = 0;

    pool.forEach((f) => {
      const b = Math.abs(base[f.id]);
      const a = Math.abs(after[f.id]);
      beforeSum += b;
      afterSum += a;
      const slip = delays[f.id] ?? 0;
      if (slip > maxSlip) maxSlip = slip;
      // 有意に低下した因子
      if (b > 0.05 && a < b * 0.9) {
        affected.push({ id: f.id, name: f.name, before: base[f.id], after: after[f.id] });
      }
    });

    const feasibility = beforeSum > 1e-6 ? clamp(afterSum / beforeSum, 0, 1) : 1;
    affected.sort((x, y) => x.after - x.before - (y.after - y.before));
    const status: MilestoneHealth['status'] =
      feasibility >= 0.85 ? 'ok' : feasibility >= 0.55 ? 'risk' : 'lost';

    result[year] = {
      year,
      feasibility,
      slipYears: Math.round(maxSlip * 10) / 10,
      status,
      affected: affected.slice(0, 4),
    };
  }
  return result;
}

/** 遅延年数の推定: ノックアウトされたノードの下流での遅延伝播 */
export function estimateDelays(
  project: Project,
  knockout: KnockoutState,
): Record<string, number> {
  const { factors: nodes, edges } = project;
  const delay: Record<string, number> = {};
  nodes.forEach((n) => (delay[n.id] = knockout.delay[n.id] ?? 0));

  // 簡易フォワードパス: 遅延 + 弱体化による追加遅延を下流に伝える
  for (let i = 0; i < nodes.length; i++) {
    for (const e of edges) {
      const srcStrength = knockout.strength[e.source];
      const weakPenalty =
        srcStrength !== undefined && srcStrength < 1
          ? (1 - srcStrength) * e.timeLagYears * 0.8
          : 0;
      const incoming = delay[e.source] * e.weight + weakPenalty;
      if (incoming > delay[e.target]) delay[e.target] = incoming;
    }
  }
  Object.keys(delay).forEach((k) => (delay[k] = Math.round(delay[k] * 10) / 10));
  return delay;
}
