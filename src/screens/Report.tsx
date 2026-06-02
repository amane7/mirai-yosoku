import { useMemo } from 'react';
import { FileText, Lightbulb, ListChecks, ShieldAlert, Crown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_META } from '../lib/types';
import { PageHeader, Panel, ScoreBar } from '../components/ui';

export function Report() {
  const { project, scoreResult, targetYear } = useStore();
  const top5 = scoreResult.ranking.slice(0, 5);

  // Generate insights heuristically from scores (生成AIによる構造化支援を模した自動生成)
  const insights = useMemo(() => generateInsights(project, scoreResult), [project, scoreResult]);

  return (
    <div>
      <PageHeader
        eyebrow="Executive Report"
        title="経営層向け 1枚サマリー"
        description="ネットワーク分析の結果を、意思決定者が読める形に自動構造化します。生成AIは「未来を予測する役」ではなく「構造化支援者」として、因子・根拠・示唆を整理する役割を担います。"
      />

      <div className="glass overflow-hidden rounded-2xl">
        {/* Report header */}
        <div
          className="border-b border-white/10 px-7 py-6"
          style={{
            background:
              'linear-gradient(120deg, rgba(139,92,246,0.14), rgba(34,211,238,0.08))',
          }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-violet/90">
            <FileText size={14} /> Strategic Brief
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-50">
            {project.name}における重要因子と打ち手
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            分析対象: {project.factors.length}因子 / {project.edges.length}因果関係 · 目標年 {targetYear}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-white/5 md:grid-cols-2">
          {/* Top factors */}
          <Section icon={<Crown size={15} />} title="最重要因子" accent="#a78bfa">
            <div className="space-y-3">
              {top5.map((r, i) => {
                const meta = CATEGORY_META[r.factor.category];
                return (
                  <div key={r.factor.id}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="tabular w-4 font-bold text-slate-500">{i + 1}</span>
                        <span className="font-semibold text-slate-100">{r.factor.name}</span>
                        <span className="text-[10px]" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                      </span>
                      <span className="tabular text-xs font-bold" style={{ color: meta.color }}>
                        {r.scores.futureCriticality.toFixed(2)}
                      </span>
                    </div>
                    <ScoreBar value={r.scores.futureCriticality} color={meta.color} />
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Insights */}
          <Section icon={<Lightbulb size={15} />} title="示唆" accent="#22d3ee">
            <ul className="space-y-3">
              {insights.implications.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <span className="mt-1 text-accent-cyan">▸</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Recommended actions */}
          <Section icon={<ListChecks size={15} />} title="推奨打ち手" accent="#10b981">
            <ul className="space-y-2">
              {insights.actions.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg bg-white/[0.025] px-3 py-2.5 text-sm text-slate-200"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accent-green/15 text-[11px] font-bold text-accent-green">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Section>

          {/* Risks to monitor */}
          <Section icon={<ShieldAlert size={15} />} title="監視すべきリスク" accent="#ef4444">
            <ul className="space-y-2">
              {insights.risks.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <span className="mt-1 text-accent-red">!</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Footer note */}
        <div className="border-t border-white/10 px-7 py-4">
          <p className="text-[11px] leading-relaxed text-slate-500">
            ※ 本サマリーは因果ネットワークの構造分析に基づく
            <b className="text-slate-400">シナリオ（予測ではない）</b>
            です。スコアは比較指標であり、不確実性を含みます。最終的な投資・人材・政策判断は、
            根拠と前提を確認のうえ人間が行ってください。
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ink-700/40 px-7 py-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${accent}1f`, color: accent }}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function generateInsights(
  project: ReturnType<typeof useStore.getState>['project'],
  scoreResult: ReturnType<typeof useStore.getState>['scoreResult'],
) {
  const ranking = scoreResult.ranking;
  const top = ranking[0]?.factor;
  const topName = top?.name ?? '中核因子';

  // Find the strongest bottleneck and the most "hidden" (high importance, low controllability)
  const byBottleneck = [...ranking].sort((a, b) => b.scores.bottleneck - a.scores.bottleneck);
  const bottleneck = byBottleneck[0]?.factor;

  const hidden = [...ranking]
    .filter((r) => r.factor.controllability < 0.5)
    .sort((a, b) => b.scores.futureCriticality - a.scores.futureCriticality)[0]?.factor;

  const controllable = [...ranking]
    .filter((r) => r.factor.controllability >= 0.6)
    .sort((a, b) => b.scores.futureCriticality - a.scores.futureCriticality)[0]?.factor;

  const lowEvidence = project.factors
    .filter((f) => f.evidenceScore < 0.62)
    .map((f) => f.name);

  const implications = [
    `${topName} が複数の経路を横断する最重要の媒介因子。技術・制度・文化を貫いて未来の流れを律している。`,
    bottleneck
      ? `${bottleneck.name} はボトルネック度が最も高く、ここが詰まると下流の複数経路が同時に細る。`
      : '',
    `技術導入そのものより、評価制度・受容性・基盤など「非技術因子」が普及速度を決定づける構造になっている。`,
    hidden
      ? `${hidden.name} は重要度が高い一方で自社からの介入余地が小さい——外部環境としてモニタリングすべき因子。`
      : '',
  ].filter(Boolean);

  const actions = [
    controllable
      ? `${controllable.name} は重要かつ介入可能性が高い。最優先で資源を配分し、てことして使う。`
      : `介入可能性の高い制度・基盤因子へ重点投資する。`,
    bottleneck ? `${bottleneck.name} のボトルネックを先回りで解消する施策を講じる。` : '',
    `好循環ループの起点（成功体験・ナレッジ共有）を意図的に作り、自走させる。`,
    `規制・標準化・受容性を技術と同時並行で設計する（後追いにしない）。`,
  ].filter(Boolean);

  const risks = [
    project.scenarios.flatMap((s) => s.risks).slice(0, 2).join(' / ') || 'シナリオ前提の崩壊',
    `重要因子の前提が崩れると、悪循環ループが好循環を打ち消す可能性。`,
    lowEvidence.length
      ? `根拠が薄い因子（${lowEvidence.slice(0, 3).join('、')}）は仮説扱いとし、継続検証が必要。`
      : `スコアの独り歩きに注意し、根拠と前提を都度確認する。`,
  ];

  return { implications, actions, risks };
}
