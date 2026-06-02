import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Route,
  Flag,
  CheckCircle2,
  ArrowDown,
  AlertTriangle,
  XCircle,
  Clock,
  GitCompareArrows,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { milestoneHealthUnder, type MilestoneHealth } from '../lib/analysis';
import { CATEGORY_META } from '../lib/types';
import { PageHeader, Panel } from '../components/ui';

export function Backcasting() {
  const { project, knockout, getActiveStory, hasIntervention } = useStore();
  const scenariosWithBackcast = project.scenarios.filter((s) => project.backcasts[s.id]);
  const [selId, setSelId] = useState(scenariosWithBackcast[0]?.id ?? '');
  const scenario = project.scenarios.find((s) => s.id === selId);
  const milestones = (project.backcasts[selId] ?? []).slice().sort((a, b) => b.year - a.year);

  const activeStory = getActiveStory();
  const ifActive = hasIntervention();

  // IF適用時の各マイルストーンの健全性
  const health = useMemo(
    () => milestoneHealthUnder(project, milestones.map((m) => m.year), knockout),
    [project, milestones, knockout],
  );

  // ロードマップ全体の達成見込み（平均）
  const overallFeasibility = useMemo(() => {
    const vals = Object.values(health).map((h) => h.feasibility);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
  }, [health]);

  return (
    <div>
      <PageHeader
        eyebrow="Backcasting Planner"
        title="バックキャスティング・ロードマップ"
        description="望ましい未来像から現在へ逆算し、各時点で必要な条件を提示します。上部のIFストーリーを切り替えると、「もしこの因子がなかったら、ロードマップのどこが崩れ・どれだけ遅れるか」を同じ画面でシームレスに重ねて確認できます。"
      />

      {/* Scenario selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {scenariosWithBackcast.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelId(s.id)}
            className={`rounded-xl border px-4 py-2.5 text-left transition ${
              selId === s.id
                ? 'border-accent-green/50 bg-accent-green/10'
                : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Flag size={14} className={selId === s.id ? 'text-accent-green' : 'text-slate-500'} />
              {s.name}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">目標年 {s.targetYear}</div>
          </button>
        ))}
      </div>

      {scenario && (
        <div className="mb-6 glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-accent-green/80">
                望ましい未来像 · {scenario.targetYear}
              </div>
              <p className="mt-1.5 text-lg font-semibold text-slate-50">{scenario.futureImage}</p>
            </div>
            {/* ロードマップ達成見込みゲージ */}
            {ifActive && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400">
                  <GitCompareArrows size={13} style={{ color: activeStory.color }} />
                  {activeStory.builtin ? '未保存の介入' : activeStory.name} での達成見込み
                </div>
                <div
                  className="mt-1 text-3xl font-bold tabular"
                  style={{ color: feasColor(overallFeasibility) }}
                >
                  {Math.round(overallFeasibility * 100)}%
                </div>
              </div>
            )}
          </div>

          {ifActive && (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallFeasibility * 100}%` }}
                transition={{ duration: 0.6 }}
                style={{ background: feasColor(overallFeasibility) }}
              />
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <Panel
        title="逆算ロードマップ"
        subtitle={ifActive ? '未来 → 現在 ／ IFストーリーの影響を重ね表示中' : '未来 → 現在'}
        icon={<Route size={16} />}
      >
        <div className="p-6">
          <div className="relative pl-8">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-accent-green/60 via-accent-cyan/40 to-accent-violet/60" />
            {milestones.map((m, i) => {
              const isNow = i === milestones.length - 1;
              const h = health[m.year];
              const showIf = ifActive && h && h.status !== 'ok';
              return (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative mb-8 last:mb-0"
                >
                  <div
                    className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-ink-800"
                    style={{
                      background: showIf
                        ? statusColor(h.status)
                        : isNow
                        ? '#a78bfa'
                        : i === 0
                        ? '#10b981'
                        : '#22d3ee',
                    }}
                  />
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span
                      className="tabular text-xl font-bold"
                      style={{ color: isNow ? '#a78bfa' : i === 0 ? '#10b981' : '#67e8f9' }}
                    >
                      {m.year}
                    </span>
                    {/* IF適用後のスリップ年 */}
                    {showIf && h.slipYears > 0 && (
                      <span className="tabular flex items-center gap-1 text-sm font-semibold text-accent-amber">
                        <Clock size={13} /> → {m.year + Math.ceil(h.slipYears)} に後ろ倒し
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-100">{m.title}</span>
                    {isNow && !showIf && (
                      <span className="rounded-full bg-accent-violet/15 px-2 py-0.5 text-[10px] font-semibold text-accent-violet">
                        今、始めるべきこと
                      </span>
                    )}
                    {showIf && <StatusBadge h={h} />}
                  </div>

                  {/* IF: 影響を受けた条件 */}
                  {showIf && h.affected.length > 0 && (
                    <div className="mt-2 rounded-lg border border-accent-red/20 bg-accent-red/[0.06] px-3 py-2">
                      <div className="mb-1 text-[11px] font-medium text-accent-red">
                        この時点で崩れる前提：
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {h.affected.map((a) => {
                          const f = project.factors.find((x) => x.id === a.id);
                          const meta = f ? CATEGORY_META[f.category] : null;
                          return (
                            <span
                              key={a.id}
                              className="tabular flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300"
                            >
                              {meta && (
                                <span
                                  className="inline-block h-1.5 w-1.5 rounded-full"
                                  style={{ background: meta.color }}
                                />
                              )}
                              {a.name}
                              <span className="text-slate-500">
                                {a.before.toFixed(2)}→<span className="text-accent-red">{a.after.toFixed(2)}</span>
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                    {m.conditions.map((c) => (
                      <li
                        key={c}
                        className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs transition ${
                          showIf && h.status === 'lost'
                            ? 'bg-accent-red/[0.04] text-slate-500 line-through decoration-accent-red/40'
                            : 'bg-white/[0.025] text-slate-300'
                        }`}
                      >
                        {showIf && h.status === 'lost' ? (
                          <XCircle size={14} className="mt-0.5 shrink-0 text-accent-red/70" />
                        ) : showIf && h.status === 'risk' ? (
                          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-accent-amber/70" />
                        ) : (
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-slate-500" />
                        )}
                        {c}
                      </li>
                    ))}
                  </ul>
                  {i < milestones.length - 1 && (
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-600">
                      <ArrowDown size={11} /> そのために、より前に必要なこと
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </Panel>

      {ifActive && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <LegendDot color="#10b981" label="達成可能（ほぼ影響なし）" />
          <LegendDot color="#f59e0b" label="要注意（前提が揺らぐ）" />
          <LegendDot color="#ef4444" label="崩壊リスク（前提が失われる）" />
        </div>
      )}

      {milestones.length === 0 && (
        <p className="mt-4 text-sm text-slate-400">
          このシナリオにはまだバックキャスティングが設定されていません。
        </p>
      )}
    </div>
  );
}

function StatusBadge({ h }: { h: MilestoneHealth }) {
  const map = {
    ok: { label: '達成可能', color: '#10b981', Icon: CheckCircle2 },
    risk: { label: '要注意', color: '#f59e0b', Icon: AlertTriangle },
    lost: { label: '崩壊リスク', color: '#ef4444', Icon: XCircle },
  }[h.status];
  const { Icon } = map;
  return (
    <span
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color: map.color, background: `${map.color}1f` }}
    >
      <Icon size={11} /> {map.label}・達成見込み{Math.round(h.feasibility * 100)}%
    </span>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function statusColor(s: MilestoneHealth['status']) {
  return s === 'ok' ? '#10b981' : s === 'risk' ? '#f59e0b' : '#ef4444';
}
function feasColor(v: number) {
  return v >= 0.85 ? '#10b981' : v >= 0.55 ? '#f59e0b' : '#ef4444';
}
