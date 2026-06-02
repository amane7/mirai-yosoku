import { useMemo, useState } from 'react';
import { Columns, TrendingDown, TrendingUp, Minus, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { compareScenarios } from '../lib/analysis';
import { CATEGORY_META } from '../lib/types';
import type { KnockoutState } from '../lib/types';
import { PageHeader, Panel, Tag } from '../components/ui';

type SideState = {
  name: string;
  // factorId -> strength (1=通常, 0=消滅)。空ならベースライン。
  strength: Record<string, number>;
  delay: Record<string, number>;
};

const blankSide = (name: string): SideState => ({ name, strength: {}, delay: {} });

export function Compare() {
  const { project } = useStore();

  const [sideA, setSideA] = useState<SideState>(() => blankSide('シナリオA：基本（介入なし）'));
  const [sideB, setSideB] = useState<SideState>(() => ({
    name: 'シナリオB：主要因子が停滞',
    // デフォルトで最初の因子を弱める例
    strength: {},
    delay: {},
  }));

  const koA: KnockoutState | undefined =
    Object.keys(sideA.strength).length || Object.keys(sideA.delay).length
      ? { strength: sideA.strength, delay: sideA.delay }
      : undefined;
  const koB: KnockoutState | undefined =
    Object.keys(sideB.strength).length || Object.keys(sideB.delay).length
      ? { strength: sideB.strength, delay: sideB.delay }
      : undefined;

  const cmp = useMemo(() => compareScenarios(project, koA, koB), [project, koA, koB]);

  const totalDelta = cmp.b.total - cmp.a.total;
  const totalPct = Math.abs(cmp.a.total) > 1e-6 ? (totalDelta / Math.abs(cmp.a.total)) * 100 : 0;

  // 影響の大きい行（上位）
  const worse = cmp.rows.filter((r) => r.delta < -0.01).slice(0, 6);
  const better = [...cmp.rows].reverse().filter((r) => r.delta > 0.01).slice(0, 6);
  const maxAbs = Math.max(0.01, ...cmp.rows.map((r) => Math.abs(r.delta)));

  return (
    <div>
      <PageHeader
        eyebrow="Scenario Comparison"
        title="シナリオ比較"
        description="2つの未来シナリオ（介入の有無・別の前提）を並べて比較します。各列に保存済みのIFストーリーを読み込むか、因子の停滞・消滅を直接設定すると、ネットワーク全体の活性度がどう変わるかを左右で対比し、因子別の差分を可視化します。"
      />

      {/* サマリー */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="シナリオA 総活性度" value={cmp.a.total.toFixed(2)} color="#22d3ee" />
        <SummaryCard label="シナリオB 総活性度" value={cmp.b.total.toFixed(2)} color="#a78bfa" />
        <SummaryCard
          label="B − A 変化"
          value={`${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(2)}（${totalPct >= 0 ? '+' : ''}${totalPct.toFixed(0)}%）`}
          color={totalDelta < 0 ? '#ef4444' : totalDelta > 0 ? '#10b981' : '#64748b'}
        />
      </div>

      {/* 介入設定パネル（A / B） */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SideEditor side={sideA} setSide={setSideA} accent="#22d3ee" label="A" />
        <SideEditor side={sideB} setSide={setSideB} accent="#a78bfa" label="B" />
      </div>

      {/* 差分チャート */}
      <Panel title="因子別インパクト（B − A）" icon={<Columns size={16} />} subtitle="左に伸びる＝Bで悪化 / 右に伸びる＝Bで改善">
        <div className="space-y-1.5 px-5 py-4">
          {cmp.rows.map((r) => {
            const meta = CATEGORY_META[r.category];
            const pct = (r.delta / maxAbs) * 50; // -50..50
            const neg = r.delta < 0;
            return (
              <div key={r.factorId} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-right text-xs text-slate-300">{r.name}</span>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                  title={meta.label}
                />
                <div className="relative h-5 flex-1">
                  {/* center line */}
                  <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
                  <div
                    className="absolute top-1/2 h-3 -translate-y-1/2 rounded-sm transition-all"
                    style={{
                      background: neg ? '#ef4444' : '#10b981',
                      opacity: 0.8,
                      ...(neg
                        ? { right: '50%', width: `${Math.abs(pct)}%` }
                        : { left: '50%', width: `${Math.abs(pct)}%` }),
                    }}
                  />
                </div>
                <span
                  className="w-16 shrink-0 text-right font-mono text-xs"
                  style={{ color: neg ? '#f87171' : r.delta > 0 ? '#34d399' : '#64748b' }}
                >
                  {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* インサイト */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title="Bで最も悪化する因子" icon={<TrendingDown size={16} className="text-rose-400" />}>
          <InsightList rows={worse} mode="worse" />
        </Panel>
        <Panel title="Bで改善・温存される因子" icon={<TrendingUp size={16} className="text-emerald-400" />}>
          <InsightList rows={better} mode="better" />
        </Panel>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-2xl px-5 py-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular" style={{ color }}>{value}</div>
    </div>
  );
}

function SideEditor({
  side,
  setSide,
  accent,
  label,
}: {
  side: SideState;
  setSide: (s: SideState) => void;
  accent: string;
  label: string;
}) {
  const { project, stories } = useStore();
  const activeCount = Object.values(side.strength).filter((v) => v < 1).length;

  const setStrength = (id: string, v: number) =>
    setSide({ ...side, strength: { ...side.strength, [id]: v } });
  const reset = () => setSide({ ...side, strength: {}, delay: {} });

  const loadStory = (storyId: string) => {
    const st = stories.find((x) => x.id === storyId);
    if (!st) return;
    setSide({
      name: st.name,
      strength: { ...st.knockout.strength },
      delay: { ...st.knockout.delay },
    });
  };

  return (
    <Panel
      icon={<SlidersHorizontal size={16} />}
      title={`列${label}：${side.name}`}
      subtitle={activeCount ? `${activeCount}個の因子に介入中` : '介入なし（ベースライン）'}
      action={
        <button
          onClick={reset}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:bg-white/5"
        >
          <RotateCcw size={12} /> リセット
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-5 py-3">
        <input
          value={side.name}
          onChange={(e) => setSide({ ...side, name: e.target.value })}
          className="inp flex-1"
          style={{ borderColor: `${accent}40` }}
        />
        {/* 保存済みIFストーリーから読み込む */}
        <select
          value=""
          onChange={(e) => e.target.value && loadStory(e.target.value)}
          className="inp w-auto shrink-0 cursor-pointer text-xs"
          title="保存済みのIFストーリーを読み込む"
        >
          <option value="">IFを読込…</option>
          {stories.map((s) => (
            <option key={s.id} value={s.id} className="bg-ink-700">
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="max-h-72 space-y-2.5 overflow-y-auto px-5 py-3">
        {project.factors.map((f) => {
          const v = side.strength[f.id] ?? 1;
          const meta = CATEGORY_META[f.category];
          return (
            <div key={f.id} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs text-slate-300" title={f.name}>{f.name}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={v}
                onChange={(e) => setStrength(f.id, Number(e.target.value))}
                className="flex-1"
                style={{ accentColor: meta.color }}
              />
              <span className="w-9 shrink-0 text-right font-mono text-[11px]" style={{ color: v < 1 ? '#f59e0b' : '#64748b' }}>
                {Math.round(v * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function InsightList({ rows, mode }: { rows: ReturnType<typeof compareScenarios>['rows']; mode: 'worse' | 'better' }) {
  if (!rows.length) {
    return <p className="px-5 py-5 text-xs text-slate-500">該当する因子はありません。</p>;
  }
  return (
    <div className="space-y-2 px-5 py-4">
      {rows.map((r) => {
        const meta = CATEGORY_META[r.category];
        const Icon = mode === 'worse' ? TrendingDown : r.delta > 0 ? TrendingUp : Minus;
        const color = mode === 'worse' ? '#f87171' : '#34d399';
        return (
          <div key={r.factorId} className="flex items-center gap-3">
            <Tag color={meta.color} soft={meta.soft}>{meta.label}</Tag>
            <span className="flex-1 truncate text-sm text-slate-200">{r.name}</span>
            {r.delayB - r.delayA > 0.1 && (
              <span className="font-mono text-[11px] text-amber-400">+{(r.delayB - r.delayA).toFixed(1)}年遅延</span>
            )}
            <span className="flex items-center gap-1 font-mono text-xs" style={{ color }}>
              <Icon size={13} />
              {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
