import { useState } from 'react';
import { Target, Calculator, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_META } from '../lib/types';
import { PageHeader, Panel, ScoreBar, Tag } from '../components/ui';
import { FactorCard } from './FutureMap';

type SortKey =
  | 'futureCriticality'
  | 'betweenness'
  | 'directInfluence'
  | 'indirectInfluence'
  | 'knockoutImpact'
  | 'bottleneck';

const COLS: { key: SortKey; label: string; short: string; color: string }[] = [
  { key: 'futureCriticality', label: 'Future Criticality', short: 'FCS', color: '#a78bfa' },
  { key: 'betweenness', label: '中心媒介性', short: '媒介性', color: '#22d3ee' },
  { key: 'directInfluence', label: '直接影響度', short: '直接', color: '#3b82f6' },
  { key: 'indirectInfluence', label: '間接影響度', short: '間接', color: '#60a5fa' },
  { key: 'knockoutImpact', label: 'ノックアウト影響', short: 'KO', color: '#f59e0b' },
  { key: 'bottleneck', label: 'ボトルネック度', short: '詰まり', color: '#ef4444' },
];

export function Ranking() {
  const { project, scoreResult, selectedFactorId, selectFactor, targetYear } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>('futureCriticality');

  const rows = [...scoreResult.ranking].sort(
    (a, b) => b.scores[sortKey] - a.scores[sortKey],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Future Criticality"
        title="急所ランキング"
        description="複数のスコアで未来因子を多面的に評価します。独自総合指標 Future Criticality Score は「議論の入口」——点数そのものより、なぜその因子が重要なのかを説明できることを重視します。"
      />

      {/* FCS formula card */}
      <div className="mb-6 glass rounded-2xl p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Calculator size={16} className="text-accent-violet" /> Future Criticality Score
        </div>
        <code className="block overflow-x-auto whitespace-nowrap rounded-lg bg-black/30 px-4 py-3 font-mono text-xs text-slate-300">
          FCS = 中心媒介性 × 影響度 × 時間重要度 × ノックアウト影響度 × 証拠強度 ÷ 代替可能性
        </code>
        <p className="mt-2 text-[11px] text-slate-500">
          目標年 {targetYear} に近いほど時間重要度が高くなります。スコアは比較指標であり、絶対値ではありません。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Panel title="ランキング" icon={<Target size={16} />} subtitle={`並び替え: ${COLS.find((c) => c.key === sortKey)?.label}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-2 py-3 font-medium">因子</th>
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => setSortKey(c.key)}
                      className={`cursor-pointer px-3 py-3 text-right font-medium transition hover:text-slate-200 ${
                        sortKey === c.key ? 'text-slate-100' : ''
                      }`}
                    >
                      {c.short}
                      {sortKey === c.key && <span className="ml-1 text-accent-cyan">▾</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const meta = CATEGORY_META[r.factor.category];
                  const active = selectedFactorId === r.factor.id;
                  return (
                    <tr
                      key={r.factor.id}
                      onClick={() => selectFactor(r.factor.id)}
                      className={`cursor-pointer border-b border-white/[0.03] transition ${
                        active ? 'bg-accent-cyan/[0.07]' : 'hover:bg-white/[0.025]'
                      }`}
                    >
                      <td className="px-4 py-3 tabular text-slate-500">{i + 1}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: meta.color }}
                          />
                          <span className="font-medium text-slate-100">{r.factor.name}</span>
                          <Tag color={meta.color} soft={meta.soft}>
                            {meta.label}
                          </Tag>
                        </div>
                      </td>
                      {COLS.map((c) => (
                        <td key={c.key} className="px-3 py-3 text-right">
                          <span
                            className="tabular text-xs font-semibold"
                            style={{
                              color:
                                c.key === sortKey ? c.color : 'rgba(203,213,225,0.7)',
                            }}
                          >
                            {(r.scores[c.key] * 100).toFixed(0)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div>
          {selectedFactorId ? (
            <FactorCard fid={selectedFactorId} />
          ) : (
            <Panel title="因子の詳細" icon={<ChevronRight size={16} />}>
              <div className="space-y-3 p-5">
                <p className="text-sm text-slate-400">
                  行をクリックすると、その因子の詳細スコアと影響構造が表示されます。
                </p>
                <div className="space-y-2">
                  {COLS.map((c) => (
                    <div key={c.key} className="flex items-center gap-2 text-xs">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: c.color }}
                      />
                      <span className="text-slate-300">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
