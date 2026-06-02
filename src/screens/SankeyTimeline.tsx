import { useMemo, useState, useRef, useCallback } from 'react';
import { Waves, Maximize2, GitBranch, Layers, Crosshair } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_META, type FactorCategory } from '../lib/types';
import { PageHeader, Panel, Pill, Tag } from '../components/ui';

type Metric = 'weight' | 'confidence' | 'influence';
type RowMode = 'category' | 'criticality';
type Granularity = 1 | 2 | 5;

// レイアウト定数
const LANE_H = 46; // 1行(レーン)の高さ
const NODE_H = 22; // ノードの高さ
const PAD_L = 96; // 左ラベル領域
const PAD_R = 28;
const PAD_T = 56; // 上の年次軸
const PAD_B = 24;

export function SankeyTimeline() {
  const { project, scoreResult, selectFactor, selectedFactorId } = useStore();
  const [metric, setMetric] = useState<Metric>('weight');
  const [rowMode, setRowMode] = useState<RowMode>('category');
  const [gran, setGran] = useState<Granularity>(2);
  const [hover, setHover] = useState<string | null>(null);

  // --- ユーザ調整可能な「時間軸」レンジ（2点スライダー） ---
  const [view, setView] = useState<[number, number]>([project.horizonStart, project.horizonEnd]);
  // プロジェクト切替時にレンジを追随
  const projRangeKey = `${project.id}:${project.horizonStart}:${project.horizonEnd}`;
  const lastKey = useRef(projRangeKey);
  if (lastKey.current !== projRangeKey) {
    lastKey.current = projRangeKey;
    setView([project.horizonStart, project.horizonEnd]);
  }
  const [vStart, vEnd] = view;

  const [width, setWidth] = useState(900);
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
  }, []);

  const layout = useMemo(() => {
    const W = Math.max(640, width);
    const plotW = W - PAD_L - PAD_R;
    const span = Math.max(1, vEnd - vStart);
    const xOf = (year: number) => PAD_L + ((Math.max(vStart, Math.min(vEnd, year)) - vStart) / span) * plotW;

    // ---- 行（レーン）割り当て ----
    type Lane = { key: string; label: string; color: string };
    let lanes: Lane[] = [];
    const laneOfFactor: Record<string, number> = {};

    if (rowMode === 'category') {
      const cats: FactorCategory[] = [];
      project.factors.forEach((f) => {
        if (!cats.includes(f.category)) cats.push(f.category);
      });
      lanes = cats.map((c) => ({ key: c, label: CATEGORY_META[c].label, color: CATEGORY_META[c].color }));
      project.factors.forEach((f) => (laneOfFactor[f.id] = cats.indexOf(f.category)));
    } else {
      // 重要度（FCS）順に縦に並べる：上＝最重要
      const ranked = [...scoreResult.ranking];
      lanes = ranked.map((r) => ({
        key: r.factor.id,
        label: r.factor.name,
        color: CATEGORY_META[r.factor.category].color,
      }));
      ranked.forEach((r, i) => (laneOfFactor[r.factor.id] = i));
    }

    const plotH = lanes.length * LANE_H;
    const yOf = (laneIdx: number) => PAD_T + laneIdx * LANE_H + LANE_H / 2;

    // ---- ノード（時間スパンのバー） ----
    const nodes = project.factors.map((f) => {
      const lane = laneOfFactor[f.id];
      const y = yOf(lane);
      const x1 = xOf(f.timeStart);
      const x2 = xOf(f.timeEnd);
      const xPeak = xOf(f.timePeak);
      const meta = CATEGORY_META[f.category];
      const fcs = scoreResult.scores[f.id]?.futureCriticality ?? 0;
      return {
        id: f.id,
        name: f.name,
        category: f.category,
        color: meta.color,
        soft: meta.soft,
        x1,
        x2: Math.max(x2, x1 + 8),
        xPeak,
        y,
        fcs,
        timeStart: f.timeStart,
        timePeak: f.timePeak,
        timeEnd: f.timeEnd,
        lane,
        // ラベルアンカー（接続点）はピーク位置
        cx: xPeak,
      };
    });
    const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

    const metricVal = (e: (typeof project.edges)[number]) =>
      metric === 'weight' ? e.weight : metric === 'confidence' ? e.confidence : e.weight * e.confidence;

    // ---- エッジ（ベジェ・リボン） ----
    const edges = project.edges
      .map((e) => {
        const s = nodeById[e.source];
        const t = nodeById[e.target];
        if (!s || !t) return null;
        // 時間遅延を視覚化：出発はソースのピーク、到着はターゲットのスタート(or 遅延考慮)
        const x1 = s.xPeak;
        const y1 = s.y;
        const x2 = t.cx;
        const y2 = t.y;
        const v = metricVal(e);
        const sw = 1 + v * 6;
        return { id: e.id, source: e.source, target: e.target, x1, y1, x2, y2, sw, dir: e.direction, v };
      })
      .filter(Boolean) as {
      id: string;
      source: string;
      target: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      sw: number;
      dir: 'positive' | 'negative';
      v: number;
    }[];

    // ---- 年次グリッド（粒度で間隔可変） ----
    const ticks: number[] = [];
    const first = Math.ceil(vStart / gran) * gran;
    for (let y = first; y <= vEnd; y += gran) ticks.push(y);
    if (ticks[0] !== vStart) ticks.unshift(vStart);
    if (ticks[ticks.length - 1] !== vEnd) ticks.push(vEnd);

    const svgH = PAD_T + plotH + PAD_B;
    return { W, svgH, lanes, nodes, nodeById, edges, ticks, xOf, plotH };
  }, [project, scoreResult, metric, rowMode, gran, width, vStart, vEnd]);

  // ---- ハイライト：選択 or ホバー の上下流経路 ----
  const focusId = hover ?? selectedFactorId;
  const focusSet = useMemo(() => {
    if (!focusId) return null;
    const up = new Set<string>([focusId]);
    const down = new Set<string>([focusId]);
    const adjOut: Record<string, string[]> = {};
    const adjIn: Record<string, string[]> = {};
    project.edges.forEach((e) => {
      (adjOut[e.source] ??= []).push(e.target);
      (adjIn[e.target] ??= []).push(e.source);
    });
    const walk = (start: string, adj: Record<string, string[]>, acc: Set<string>) => {
      const stack = [start];
      while (stack.length) {
        const u = stack.pop()!;
        for (const v of adj[u] ?? []) if (!acc.has(v)) { acc.add(v); stack.push(v); }
      }
    };
    walk(focusId, adjOut, down);
    walk(focusId, adjIn, up);
    const nodeSet = new Set<string>([...up, ...down]);
    const edgeSet = new Set<string>();
    project.edges.forEach((e) => {
      if (nodeSet.has(e.source) && nodeSet.has(e.target)) {
        // 経路に乗るエッジのみ（上流側 or 下流側で一貫）
        if ((up.has(e.target) && up.has(e.source)) || (down.has(e.source) && down.has(e.target)))
          edgeSet.add(e.id);
      }
    });
    return { nodeSet, edgeSet };
  }, [focusId, project.edges]);

  const isDim = (id: string, kind: 'node' | 'edge') =>
    focusSet ? !(kind === 'node' ? focusSet.nodeSet.has(id) : focusSet.edgeSet.has(id)) : false;

  return (
    <div>
      <PageHeader
        eyebrow="Timeline Flow"
        title="未来フロー（時間軸ビュー）"
        description="各因子を「重要化する実時間」に正確に配置した因果フローです。横軸は西暦、バーは因子が効いてくる期間（開始〜ピーク〜終了）、線は因果の流れ（太さ=選択指標 / 赤=抑制）。時間軸レンジ・粒度・行の並べ方を自由に設定できます。"
      />

      <Panel
        title="Timeline Flow"
        icon={<Waves size={16} />}
        subtitle={`表示レンジ: ${vStart} → ${vEnd}（全体 ${project.horizonStart}–${project.horizonEnd}）`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <ControlGroup icon={<Maximize2 size={13} />} label="指標">
              <Pill active={metric === 'weight'} onClick={() => setMetric('weight')}>影響度</Pill>
              <Pill active={metric === 'confidence'} onClick={() => setMetric('confidence')}>信頼度</Pill>
              <Pill active={metric === 'influence'} onClick={() => setMetric('influence')}>実効</Pill>
            </ControlGroup>
            <ControlGroup icon={<Layers size={13} />} label="行の並び">
              <Pill active={rowMode === 'category'} onClick={() => setRowMode('category')}>カテゴリ</Pill>
              <Pill active={rowMode === 'criticality'} onClick={() => setRowMode('criticality')}>急所順</Pill>
            </ControlGroup>
            <ControlGroup icon={<GitBranch size={13} />} label="粒度">
              <Pill active={gran === 1} onClick={() => setGran(1)}>1年</Pill>
              <Pill active={gran === 2} onClick={() => setGran(2)}>2年</Pill>
              <Pill active={gran === 5} onClick={() => setGran(5)}>5年</Pill>
            </ControlGroup>
          </div>
        }
      >
        {/* --- 時間軸レンジスライダー（2ハンドル） --- */}
        <div className="border-b border-white/5 px-5 py-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Crosshair size={13} className="text-accent-cyan" />
            時間軸レンジ設定
            <span className="ml-auto font-mono text-accent-cyan">{vStart} – {vEnd}</span>
          </div>
          <RangeSlider
            min={project.horizonStart}
            max={project.horizonEnd}
            value={view}
            onChange={setView}
          />
          <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500">
            <span>{project.horizonStart}</span>
            <span>{project.horizonEnd}</span>
          </div>
        </div>

        {/* --- SVG タイムライン --- */}
        <div ref={measure} className="relative overflow-x-hidden px-2 py-2">
          <svg width={layout.W} height={layout.svgH} className="block">
            {/* 年次グリッド */}
            {layout.ticks.map((yr) => {
              const x = layout.xOf(yr);
              return (
                <g key={yr}>
                  <line x1={x} y1={PAD_T - 8} x2={x} y2={layout.svgH - PAD_B} stroke="rgba(148,163,184,0.10)" strokeWidth={1} />
                  <text x={x} y={PAD_T - 14} textAnchor="middle" fontSize={10} fill="#64748b" fontFamily="monospace">
                    {yr}
                  </text>
                </g>
              );
            })}
            {/* レーンの区切り + ラベル */}
            {layout.lanes.map((lane, i) => {
              const y0 = PAD_T + i * LANE_H;
              return (
                <g key={lane.key}>
                  {i % 2 === 1 && (
                    <rect x={PAD_L} y={y0} width={layout.W - PAD_L - PAD_R} height={LANE_H} fill="rgba(255,255,255,0.015)" />
                  )}
                  <text x={PAD_L - 10} y={y0 + LANE_H / 2 + 3} textAnchor="end" fontSize={11} fill={lane.color} className="font-medium">
                    {lane.label.length > 7 ? lane.label.slice(0, 7) : lane.label}
                  </text>
                </g>
              );
            })}

            {/* エッジ（ベジェ・リボン） */}
            <g>
              {layout.edges.map((e) => {
                const dim = isDim(e.id, 'edge');
                const dx = Math.max(28, Math.abs(e.x2 - e.x1) * 0.5);
                const d = `M ${e.x1} ${e.y1} C ${e.x1 + dx} ${e.y1}, ${e.x2 - dx} ${e.y2}, ${e.x2} ${e.y2}`;
                const color = e.dir === 'negative' ? '#ef4444' : '#38bdf8';
                return (
                  <path
                    key={e.id}
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={e.sw}
                    strokeLinecap="round"
                    opacity={dim ? 0.05 : focusSet ? 0.55 : 0.28}
                    style={{ transition: 'opacity 0.2s' }}
                  />
                );
              })}
            </g>

            {/* ノード（時間スパンバー + ピークマーカー） */}
            <g>
              {layout.nodes.map((n) => {
                const dim = isDim(n.id, 'node');
                const w = n.x2 - n.x1;
                return (
                  <g
                    key={n.id}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                    opacity={dim ? 0.18 : 1}
                    onMouseEnter={() => setHover(n.id)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => selectFactor(selectedFactorId === n.id ? null : n.id)}
                  >
                    {/* スパンバー */}
                    <rect
                      x={n.x1}
                      y={n.y - NODE_H / 2}
                      width={w}
                      height={NODE_H}
                      rx={NODE_H / 2}
                      fill={n.soft}
                      stroke={n.color}
                      strokeWidth={selectedFactorId === n.id ? 2 : 1}
                    />
                    {/* ピークマーカー */}
                    <circle cx={n.xPeak} cy={n.y} r={4.5} fill={n.color} />
                    {/* FCS インジケータ（バー内塗り） */}
                    <rect
                      x={n.x1}
                      y={n.y - NODE_H / 2}
                      width={Math.max(4, w * n.fcs)}
                      height={NODE_H}
                      rx={NODE_H / 2}
                      fill={n.color}
                      opacity={0.22}
                    />
                    {/* ラベル */}
                    <text
                      x={n.xPeak}
                      y={n.y - NODE_H / 2 - 5}
                      textAnchor="middle"
                      fontSize={10.5}
                      fill="#e2e8f0"
                      className="font-medium"
                      style={{ pointerEvents: 'none' }}
                    >
                      {n.name}
                    </text>
                    <title>{`${n.name}\n期間: ${n.timeStart}–${n.timeEnd}（ピーク ${n.timePeak}）\n急所スコア: ${Math.round(n.fcs * 100)}`}</title>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/5 px-5 py-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-6 rounded-full" style={{ background: '#38bdf8' }} />促進</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-6 rounded-full" style={{ background: '#ef4444' }} />抑制</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded-full bg-white/15" />バー=重要化期間</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-white/60" />●=ピーク年</span>
          <span className="ml-auto text-slate-500">ノードをクリック/ホバーで上下流経路をハイライト</span>
        </div>
      </Panel>

      {/* 選択中ノードの説明 */}
      {selectedFactorId && (
        <div className="mt-4">
          <FocusSummary id={selectedFactorId} />
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        ※ 横位置は <b className="text-slate-300">実際の西暦</b> に対応します（2030年に効く因子は2030の目盛り上に配置）。
        フィードバックループ（循環）は <b className="text-slate-300">因果ループ</b> 画面で確認できます。
      </p>
    </div>
  );
}

// ---- 選択ノードのミニサマリー ----
function FocusSummary({ id }: { id: string }) {
  const { project, scoreResult } = useStore();
  const f = project.factors.find((x) => x.id === id);
  if (!f) return null;
  const sc = scoreResult.scores[id];
  const meta = CATEGORY_META[f.category];
  const ins = project.edges.filter((e) => e.target === id).length;
  const outs = project.edges.filter((e) => e.source === id).length;
  return (
    <Panel className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tag color={meta.color} soft={meta.soft}>{meta.label}</Tag>
        <h4 className="text-sm font-semibold text-slate-100">{f.name}</h4>
        <span className="font-mono text-xs text-slate-500">{f.timeStart}–{f.timeEnd}（ピーク {f.timePeak}）</span>
        <span className="ml-auto text-xs text-slate-400">
          入力 <b className="text-slate-200">{ins}</b> / 出力 <b className="text-slate-200">{outs}</b> ・
          急所スコア <b className="text-accent-cyan">{Math.round((sc?.futureCriticality ?? 0) * 100)}</b>
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{f.description}</p>
    </Panel>
  );
}

function ControlGroup({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </span>
      <div className="flex items-center gap-0.5">{children}</div>
    </div>
  );
}

// ---- 2ハンドル レンジスライダー ----
function RangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const span = Math.max(1, max - min);
  const pctLo = ((lo - min) / span) * 100;
  const pctHi = ((hi - min) / span) * 100;

  const setLo = (v: number) => onChange([Math.min(v, hi - 1), hi]);
  const setHi = (v: number) => onChange([lo, Math.max(v, lo + 1)]);

  return (
    <div className="relative h-6">
      {/* track */}
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/8" />
      {/* active range */}
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-accent-cyan/70 to-accent-violet/70"
        style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
      />
      {/* two native range inputs stacked */}
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={lo}
        onChange={(e) => setLo(Number(e.target.value))}
        className="range-thumb pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
        style={{ zIndex: lo > max - 2 ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={hi}
        onChange={(e) => setHi(Number(e.target.value))}
        className="range-thumb pointer-events-none absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
