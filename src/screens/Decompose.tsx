import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Microscope,
  PieChart,
  SlidersHorizontal,
  Layers3,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_META, DIMENSION_META, type FactorDimensionKey } from '../lib/types';
import {
  fcsContributions,
  dimensionSensitivity,
  subFactorBreakdown,
  rolledUpFactor,
} from '../lib/analysis';
import { PageHeader, Panel, ScoreBar, Tag } from '../components/ui';

export function Decompose() {
  const { project, scoreResult, targetYear, selectedFactorId, selectFactor } = useStore();

  // 既定で最も急所性の高い因子を選択
  const topId = scoreResult.ranking[0]?.factor.id ?? null;
  const focusId = selectedFactorId ?? topId;
  const focus = project.factors.find((f) => f.id === focusId) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Factor Decomposition"
        title="因子の分解分析"
        description="因子を「なぜ急所なのか」まで細分化して読み解きます。①FCSがどの要素から生まれているかの因数分解、②どの軸を磨けばスコアが最も動くかの感応度分析、③因子をサブ因子に分割して構成要素レベルで分析——3つのレンズで粒度を一段深く掘り下げます。"
      />

      {/* 因子セレクタ */}
      <Panel
        title="分析する因子を選ぶ"
        icon={<Microscope size={16} />}
        subtitle="急所性（FCS）が高い順に並んでいます"
        className="mb-6"
      >
        <div className="flex flex-wrap gap-2 p-4">
          {scoreResult.ranking.map((r) => {
            const meta = CATEGORY_META[r.factor.category];
            const active = r.factor.id === focusId;
            const hasSubs = (r.factor.subFactors?.length ?? 0) > 0;
            return (
              <button
                key={r.factor.id}
                onClick={() => selectFactor(r.factor.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  active
                    ? 'ring-1'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  color: meta.color,
                  background: meta.soft,
                  ...(active ? ({ boxShadow: `0 0 0 1px ${meta.color}` } as any) : {}),
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: meta.color }}
                />
                {r.factor.name}
                <span className="tabular text-[10px] opacity-80">
                  {Math.round(r.scores.futureCriticality * 100)}
                </span>
                {hasSubs && <Layers3 size={11} className="opacity-70" />}
              </button>
            );
          })}
        </div>
      </Panel>

      {focus ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FcsBreakdown factorId={focus.id} targetYear={targetYear} />
            <Sensitivity factorId={focus.id} targetYear={targetYear} />
          </div>
          <SubFactorPanel factorId={focus.id} />
        </div>
      ) : (
        <p className="text-sm text-slate-400">因子がありません。</p>
      )}
    </div>
  );
}

// ============================ ① FCS因数分解 ============================
function FcsBreakdown({ factorId, targetYear }: { factorId: string; targetYear: number }) {
  const { project } = useStore();
  const { contributions } = useMemo(
    () => fcsContributions(project, factorId, targetYear),
    [project, factorId, targetYear],
  );

  return (
    <Panel
      title="① FCSの因数分解"
      icon={<PieChart size={16} />}
      subtitle="この因子の急所性は、どの要素から生まれているか"
    >
      <div className="space-y-4 p-5">
        {/* 積層バー */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
          {contributions.map((c) => (
            <div
              key={c.key}
              style={{ width: `${c.share * 100}%`, background: c.color }}
              title={`${c.label} ${Math.round(c.share * 100)}%`}
            />
          ))}
        </div>

        <div className="space-y-3">
          {contributions.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3"
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{c.label}</span>
              <span className="tabular text-[11px] text-slate-500">×{c.value.toFixed(2)}</span>
              <span className="w-12 text-right tabular text-xs font-semibold" style={{ color: c.color }}>
                {Math.round(c.share * 100)}%
              </span>
            </motion.div>
          ))}
        </div>

        <p className="rounded-lg bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          FCS = 各要素の積です。ここでは対数空間で寄与を分解し、「どの要素がこの因子を急所たらしめているか」の比率を示しています。最大の要素が、この因子の急所性の主因です。
        </p>
      </div>
    </Panel>
  );
}

// ============================ ② 感応度分析 ============================
function Sensitivity({ factorId, targetYear }: { factorId: string; targetYear: number }) {
  const { project } = useStore();
  const sens = useMemo(
    () => dimensionSensitivity(project, factorId, targetYear),
    [project, factorId, targetYear],
  );
  const maxMag = Math.max(1e-6, ...sens.map((s) => s.magnitude));

  return (
    <Panel
      title="② 感応度分析（テコ）"
      icon={<SlidersHorizontal size={16} />}
      subtitle="どの軸を動かすとFCSが最も変わるか"
    >
      <div className="space-y-4 p-5">
        {sens.map((s, i) => {
          const meta = DIMENSION_META[s.key];
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-200">{s.label}</span>
                  <span className="tabular text-[10px] text-slate-500">現在 {s.current.toFixed(2)}</span>
                  {i === 0 && (
                    <span className="rounded-full bg-accent-violet/15 px-1.5 py-0.5 text-[9px] font-semibold text-accent-violet ring-1 ring-accent-violet/30">
                      最大のテコ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 tabular text-[11px]">
                  <span className="flex items-center gap-0.5 text-emerald-400">
                    <ArrowUpRight size={11} />
                    {pctLabel(s.deltaUp)}
                  </span>
                  <span className="flex items-center gap-0.5 text-rose-400">
                    <ArrowDownRight size={11} />
                    {pctLabel(s.deltaDown)}
                  </span>
                </div>
              </div>
              {/* マグニチュードバー */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(s.magnitude / maxMag) * 100}%`,
                    background: 'linear-gradient(90deg,#a78bfa88,#a78bfa)',
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">{meta.hint}</p>
            </motion.div>
          );
        })}
        <p className="rounded-lg bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          各軸を±0.1動かしたときのFCS変化率です。バーが長い軸ほど「テコが効く」——少ない労力で急所性を大きく動かせる介入点です。
        </p>
      </div>
    </Panel>
  );
}

function pctLabel(v: number) {
  const p = Math.round(v * 100);
  return `${p > 0 ? '+' : ''}${p}%`;
}

// ============================ ③ サブ因子（細分化） ============================
const DIMS: FactorDimensionKey[] = [
  'maturity',
  'uncertainty',
  'substitutability',
  'controllability',
  'evidenceScore',
];

function SubFactorPanel({ factorId }: { factorId: string }) {
  const { project, addSubFactor, updateSubFactor, deleteSubFactor } = useStore();
  const factor = project.factors.find((f) => f.id === factorId);
  if (!factor) return null;

  const subs = factor.subFactors ?? [];
  const breakdown = subFactorBreakdown(factor);
  const rolled = rolledUpFactor(factor);

  return (
    <Panel
      title="③ サブ因子に分解する"
      icon={<Layers3 size={16} />}
      subtitle={`「${factor.name}」を構成要素に細分化し、粒度を一段深く分析`}
      action={
        <button
          onClick={() => addSubFactor(factorId)}
          className="flex items-center gap-1.5 rounded-lg bg-accent-cyan/15 px-3 py-1.5 text-xs font-semibold text-accent-cyan ring-1 ring-accent-cyan/40 transition hover:bg-accent-cyan/25"
        >
          <Plus size={13} /> サブ因子を追加
        </button>
      }
    >
      <div className="p-5">
        {subs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Lightbulb size={28} className="text-slate-600" />
            <p className="max-w-md text-sm text-slate-400">
              この因子はまだ細分化されていません。サブ因子に分割すると、5つの指標は
              <span className="text-slate-200">重み付き平均でロールアップ</span>
              され、「どの構成要素が因子全体の性質を決めているか」を分析できます。
            </p>
            <button
              onClick={() => addSubFactor(factorId)}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-accent-cyan/30 bg-accent-cyan/5 px-4 py-2 text-xs font-medium text-accent-cyan transition hover:bg-accent-cyan/10"
            >
              <Plus size={14} /> 最初のサブ因子を作る
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ロールアップ結果のサマリ */}
            <div className="rounded-xl bg-black/20 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span>ロールアップ後の因子指標</span>
                <Tag color="#22d3ee" soft="rgba(34,211,238,0.16)">
                  {subs.length} サブ因子
                </Tag>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                {DIMS.map((k) => (
                  <div key={k}>
                    <ScoreBar
                      value={rolled[k] as number}
                      label={DIMENSION_META[k].label}
                      color="#22d3ee"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 寄与ランキング */}
            <div>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                構成要素の寄与（重み × 局所スコア）
              </h4>
              <div className="space-y-2">
                {breakdown.map((b, i) => {
                  const score = b.weightShare * b.localScore;
                  const max = Math.max(
                    1e-6,
                    ...breakdown.map((x) => x.weightShare * x.localScore),
                  );
                  return (
                    <div key={b.sub.id} className="flex items-center gap-3">
                      <span className="w-4 text-right tabular text-[11px] text-slate-500">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{b.sub.name}</span>
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(score / max) * 100}%`,
                            background: 'linear-gradient(90deg,#a3e63588,#a3e635)',
                          }}
                        />
                      </div>
                      <span className="w-10 text-right tabular text-[11px] text-slate-400">
                        {Math.round(b.weightShare * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* サブ因子エディタ */}
            <div className="space-y-3">
              {subs.map((sub) => (
                <div key={sub.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      value={sub.name}
                      onChange={(e) => updateSubFactor(factorId, sub.id, { name: e.target.value })}
                      className="flex-1 rounded-lg border border-white/10 bg-ink-700/60 px-3 py-1.5 text-sm font-medium text-slate-100 outline-none focus:border-accent-cyan/40"
                    />
                    <button
                      onClick={() => {
                        if (confirm(`サブ因子「${sub.name}」を削除しますか？`))
                          deleteSubFactor(factorId, sub.id);
                      }}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    value={sub.description ?? ''}
                    placeholder="説明（任意）"
                    onChange={(e) => updateSubFactor(factorId, sub.id, { description: e.target.value })}
                    className="mb-3 w-full rounded-lg border border-white/10 bg-ink-700/60 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-accent-cyan/40"
                  />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                    <SubSlider
                      label="寄与重み"
                      value={sub.weight}
                      max={3}
                      onChange={(v) => updateSubFactor(factorId, sub.id, { weight: v })}
                    />
                    {DIMS.map((k) => (
                      <SubSlider
                        key={k}
                        label={DIMENSION_META[k].label}
                        value={sub[k]}
                        onChange={(v) => updateSubFactor(factorId, sub.id, { [k]: v } as any)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function SubSlider({
  label,
  value,
  onChange,
  max = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 flex items-center justify-between text-[10px] font-medium text-slate-400">
        <span>{label}</span>
        <span className="tabular text-slate-300">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
