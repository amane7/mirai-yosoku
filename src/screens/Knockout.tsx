import { useMemo } from 'react';
import {
  Zap,
  RotateCcw,
  AlertTriangle,
  ArrowDownRight,
  Clock,
  Ban,
  ArrowRight,
  GitCompareArrows,
} from 'lucide-react';
import { BookmarkPlus } from 'lucide-react';
import { EChart } from '../components/EChart';
import { useStore } from '../store/useStore';
import { CATEGORY_META } from '../lib/types';
import { PageHeader, Panel, Tag } from '../components/ui';

export function Knockout() {
  const { project, knockout, setStrength, setDelay, resetKnockout, getKnockoutDiff, getDelays, saveCurrentAsStory, getActiveStory } =
    useStore();
  const activeStory = getActiveStory();

  const { diffs, baselineTotal, afterTotal } = useMemo(
    () => getKnockoutDiff(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, knockout],
  );
  const delays = useMemo(() => getDelays(), [project, knockout]); // eslint-disable-line

  // 「いま消した／弱めた因子」のリスト
  const removed = project.factors.filter((f) => (knockout.strength[f.id] ?? 1) < 1);
  const delayed = project.factors.filter((f) => (knockout.delay[f.id] ?? 0) > 0);
  const hasChange = removed.length > 0 || delayed.length > 0;

  const totalDrop =
    baselineTotal > 0 ? Math.max(0, (baselineTotal - afterTotal) / baselineTotal) : 0;

  const impacted = diffs.filter((d) => d.deltaPct < -0.03).slice(0, 10);

  // ---- before / after 並列バーチャート ----
  const beforeAfter = useMemo(() => {
    const rows = [...diffs]
      .filter((d) => Math.abs(d.deltaPct) > 0.005 || Math.abs(d.baseline - d.after) > 0.01)
      .sort((a, b) => a.deltaPct - b.deltaPct)
      .slice(0, 12);
    const maxV = Math.max(0.01, ...rows.flatMap((r) => [Math.abs(r.baseline), Math.abs(r.after)]));
    return { rows, maxV };
  }, [diffs]);

  const chartOption = useMemo(() => {
    const items = beforeAfter.rows;
    const names = items.map((d) => d.name).reverse();
    return {
      backgroundColor: 'transparent',
      grid: { left: 96, right: 24, top: 28, bottom: 24 },
      legend: {
        data: ['Before（現状）', 'After（もしも●●がなかったら）'],
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0,
        itemWidth: 14,
        itemHeight: 8,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(10,14,26,0.95)',
        borderColor: 'rgba(148,163,184,0.2)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (ps: any[]) => {
          const name = ps[0]?.name ?? '';
          const b = ps.find((p) => p.seriesName.startsWith('Before'))?.value ?? 0;
          const a = ps.find((p) => p.seriesName.startsWith('After'))?.value ?? 0;
          const pct = Math.abs(b) > 1e-6 ? ((a - b) / Math.abs(b)) * 100 : 0;
          return `<b>${name}</b><br/>Before: ${(+b).toFixed(2)}<br/>After: ${(+a).toFixed(2)}<br/>変化: <b style="color:${
            pct < 0 ? '#f87171' : '#34d399'
          }">${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%</b>`;
        },
      },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)' } },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { color: '#cbd5e1', fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(148,163,184,0.15)' } },
      },
      series: [
        {
          name: 'Before（現状）',
          type: 'bar',
          data: items.map((d) => +d.baseline.toFixed(3)).reverse(),
          itemStyle: { color: 'rgba(148,163,184,0.55)', borderRadius: [0, 3, 3, 0] },
          barWidth: 9,
          barGap: '20%',
        },
        {
          name: 'After（もしも●●がなかったら）',
          type: 'bar',
          data: items
            .map((d) => ({
              value: +d.after.toFixed(3),
              itemStyle: {
                color: d.after < d.baseline ? '#ef4444' : '#10b981',
                borderRadius: [0, 3, 3, 0],
              },
            }))
            .reverse(),
          barWidth: 9,
        },
      ],
    };
  }, [beforeAfter]);

  const presets = [
    { label: 'AI/生成AIがなかったら', apply: () => kill(['ai', 'genai']) },
    { label: 'データ基盤がなかったら', apply: () => kill(['data', 'semicon']) },
    { label: '規制整備を5年遅延', apply: () => delay(['reg', 'evaluation'], 5) },
    { label: '受容性/心理的安全性が低下', apply: () => weaken(['accept', 'psafety'], 0.3) },
  ];

  function weaken(ids: string[], v = 0.4) {
    ids.forEach((id) => {
      if (project.factors.some((f) => f.id === id)) setStrength(id, v);
    });
  }
  function kill(ids: string[]) {
    ids.forEach((id) => {
      if (project.factors.some((f) => f.id === id)) setStrength(id, 0);
    });
  }
  function delay(ids: string[], y: number) {
    ids.forEach((id) => {
      if (project.factors.some((f) => f.id === id)) setDelay(id, y);
    });
  }

  // 「もしも●●がなかったら」のラベル
  const scenarioLabel = removed.length
    ? removed.map((f) => f.name).slice(0, 3).join('・') + (removed.length > 3 ? ` 他${removed.length - 3}件` : '')
    : null;

  return (
    <div>
      <PageHeader
        eyebrow="Knockout Simulator"
        title="反実仮想シミュレーション"
        description="「もしこの因子が なかったら / 弱まったら / 遅れたら？」——因子を取り除き、未来シナリオが現状(Before)からどう変わる(After)かを並べて比較します。これがこのアプリ最大の目玉、未来の急所を炙り出す機能です。"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Controls */}
        <Panel
          title="因子の操作"
          icon={<Zap size={16} />}
          action={
            <button
              onClick={resetKnockout}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/5"
            >
              <RotateCcw size={12} /> リセット
            </button>
          }
        >
          <div className="border-b border-white/5 px-5 py-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              「もしも〜がなかったら」プリセット
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={p.apply}
                  className="rounded-lg border border-accent-amber/30 bg-accent-amber/10 px-2.5 py-1 text-[11px] font-medium text-accent-amber transition hover:bg-accent-amber/20"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto p-5">
            {project.factors.map((f) => {
              const meta = CATEGORY_META[f.category];
              const strength = knockout.strength[f.id] ?? 1;
              const d = knockout.delay[f.id] ?? 0;
              const touched = strength < 1 || d > 0;
              const isGone = strength === 0;
              return (
                <div
                  key={f.id}
                  className={`rounded-xl border p-3 transition ${
                    isGone
                      ? 'border-accent-red/50 bg-accent-red/[0.07]'
                      : touched
                      ? 'border-accent-amber/40 bg-accent-amber/[0.06]'
                      : 'border-white/5'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-100">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: meta.color }}
                      />
                      {f.name}
                    </span>
                    {/* ワンクリック「なかったら」トグル */}
                    <button
                      onClick={() => setStrength(f.id, isGone ? 1 : 0)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                        isGone
                          ? 'bg-accent-red/20 text-accent-red ring-1 ring-accent-red/50'
                          : 'border border-white/10 text-slate-400 hover:border-accent-red/40 hover:text-accent-red'
                      }`}
                      title="この因子が「なかったら」を即シミュレート"
                    >
                      <Ban size={11} />
                      {isGone ? 'なし' : 'なかったら'}
                    </button>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="w-9 text-[10px] text-slate-500">強度</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={strength}
                      onChange={(e) => setStrength(f.id, Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="tabular w-9 text-right text-xs font-semibold text-slate-400">
                      {Math.round(strength * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-9 text-[10px] text-slate-500">遅延</span>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={1}
                      value={d}
                      onChange={(e) => setDelay(f.id, Number(e.target.value))}
                      className="accent-amber flex-1"
                    />
                    <span className="tabular w-9 text-right text-[11px] text-slate-400">
                      {d}年
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Results */}
        <div className="space-y-6">
          {/* 「もしも」シナリオ見出し */}
          {scenarioLabel && (
            <div className="glass flex flex-wrap items-center gap-3 rounded-2xl px-5 py-3.5">
              <GitCompareArrows size={18} className="shrink-0 text-accent-cyan" />
              <span className="text-sm text-slate-300">
                もしも <b className="text-accent-red">{scenarioLabel}</b> がなかったら…
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {removed.map((f) => (
                  <Tag key={f.id} color="#ef4444" soft="rgba(239,68,68,0.14)">
                    {f.name}
                  </Tag>
                ))}
                {/* このIFをストーリーとして保存（現実がアクティブな時のみ＝未保存） */}
                {activeStory.builtin && (
                  <button
                    onClick={() => {
                      const n = prompt(
                        'このIFストーリーに名前を付けて保存します',
                        `もし ${removed.map((f) => f.name).slice(0, 2).join('・')} がなかったら`,
                      );
                      if (n !== null) saveCurrentAsStory(n);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-accent-cyan/15 px-3 py-1.5 text-xs font-semibold text-accent-cyan ring-1 ring-accent-cyan/40 transition hover:bg-accent-cyan/25"
                  >
                    <BookmarkPlus size={14} /> このIFを保存
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Before / After サマリー（全体活性度） */}
          <Panel
            title="Before → After（全体への影響）"
            subtitle="ネットワーク全体の活性度がどう変わるか"
            icon={<GitCompareArrows size={16} />}
          >
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[1fr_auto_1fr_auto]">
              <BeforeAfterCard label="Before（現状）" value={baselineTotal.toFixed(1)} color="#94a3b8" />
              <div className="hidden items-center justify-center sm:flex">
                <ArrowRight size={22} className="text-slate-600" />
              </div>
              <BeforeAfterCard
                label="After（もしも〜がなかったら）"
                value={afterTotal.toFixed(1)}
                color={hasChange ? '#ef4444' : '#94a3b8'}
                sub={
                  hasChange
                    ? `${baselineTotal > 0 ? Math.round(((afterTotal - baselineTotal) / baselineTotal) * 100) : 0}%`
                    : undefined
                }
              />
              <div className="flex flex-col items-center justify-center rounded-xl bg-accent-red/[0.08] px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ArrowDownRight size={13} className="text-accent-red" /> 低下
                </div>
                <div className="mt-1 text-3xl font-bold tabular text-accent-red">
                  {Math.round(totalDrop * 100)}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-white/5 bg-white/5">
              <MiniStat label="影響を受けた因子" value={`${impacted.length}`} color="#f59e0b" icon={<AlertTriangle size={13} />} />
              <MiniStat label="取り除いた因子" value={`${removed.length}`} color="#ef4444" icon={<Ban size={13} />} />
              <MiniStat
                label="最大遅延"
                value={`${Math.max(0, ...Object.values(delays)).toFixed(1)}年`}
                color="#a78bfa"
                icon={<Clock size={13} />}
              />
            </div>
          </Panel>

          {/* Before/After 並列バー */}
          <Panel
            title="因子ごとの Before / After 比較"
            subtitle="灰＝現状(Before) / 色＝もしも〜がなかったら(After)"
            icon={<Zap size={16} />}
          >
            {hasChange ? (
              <EChart option={chartOption} height={Math.max(320, beforeAfter.rows.length * 30 + 60)} />
            ) : (
              <div className="grid h-[360px] place-items-center px-5 text-center">
                <div>
                  <GitCompareArrows size={32} className="mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-400">
                    左パネルで因子の <b className="text-accent-red">「なかったら」</b> を押すか、
                    <br />
                    上部のプリセットを選ぶと、
                    <br />
                    Before/After が並んで比較できます。
                  </p>
                </div>
              </div>
            )}
          </Panel>

          {hasChange && impacted.length > 0 && (
            <Panel title="影響を受けた経路（Before → After）" icon={<AlertTriangle size={16} />}>
              <div className="space-y-2 p-5">
                {impacted.map((d) => {
                  const f = project.factors.find((x) => x.id === d.factorId)!;
                  const meta = CATEGORY_META[f.category];
                  const dy = delays[d.factorId] ?? 0;
                  return (
                    <div
                      key={d.factorId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: meta.color }}
                        />
                        <span className="text-sm font-medium text-slate-100">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {/* before -> after の実数値 */}
                        <span className="tabular flex items-center gap-1.5 text-slate-400">
                          <span className="text-slate-500">{d.baseline.toFixed(2)}</span>
                          <ArrowRight size={11} className="text-slate-600" />
                          <span className="font-semibold text-accent-red">{d.after.toFixed(2)}</span>
                        </span>
                        {dy > 0 && <span className="tabular text-accent-violet">+{dy}年</span>}
                        <span className="tabular w-12 text-right font-semibold text-accent-red">
                          {Math.round(d.deltaPct * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function BeforeAfterCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="glass-soft rounded-xl px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular" style={{ color }}>
          {value}
        </span>
        {sub && <span className="text-sm font-medium text-accent-red">{sub}</span>}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-ink-800/40 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px]" style={{ color }}>
        {icon} {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular text-slate-100">{value}</div>
    </div>
  );
}
