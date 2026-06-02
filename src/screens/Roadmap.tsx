import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Map as MapIcon,
  Cpu,
  TrendingUp,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Microscope,
  Globe2,
  Search,
} from 'lucide-react';
import {
  ROADMAP_ERAS,
  ROADMAP_AXIS_META,
  ROADMAP_PEST,
  type RoadmapAxisKey,
  type RoadmapKeyword,
} from '../data/roadmap-data';
import { useStore } from '../store/useStore';
import { PageHeader, Panel, Tag } from '../components/ui';

const AXIS_ICON: Record<RoadmapAxisKey, typeof Cpu> = {
  technology: Cpu,
  market: TrendingUp,
  literacy: GraduationCap,
  culture: Sparkles,
};

const AXIS_ORDER: RoadmapAxisKey[] = ['technology', 'market', 'literacy', 'culture'];

const LEVEL_COLOR: Record<string, string> = {
  高: '#ef4444',
  中: '#f59e0b',
  低: '#64748b',
};

function totalKeywords(): number {
  return ROADMAP_ERAS.reduce(
    (sum, e) => sum + AXIS_ORDER.reduce((s, a) => s + e.axes[a].length, 0),
    0,
  );
}

export function Roadmap() {
  const navigate = useNavigate();
  const setProject = useStore((s) => s.setProject);
  const [activeEra, setActiveEra] = useState<string>(ROADMAP_ERAS[0].era);
  const [query, setQuery] = useState('');
  const [showPest, setShowPest] = useState(false);

  const era = ROADMAP_ERAS.find((e) => e.era === activeEra) ?? ROADMAP_ERAS[0];

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return null;
    const hits: { axis: RoadmapAxisKey; era: string; kw: RoadmapKeyword }[] = [];
    for (const e of ROADMAP_ERAS) {
      for (const axis of AXIS_ORDER) {
        for (const kw of e.axes[axis]) {
          if (
            kw.name.toLowerCase().includes(q) ||
            kw.summary.toLowerCase().includes(q)
          ) {
            hits.push({ axis, era: e.era, kw });
          }
        }
      }
    }
    return hits;
  }, [q]);

  const openAnalysis = () => {
    setProject('roadmap');
    navigate('/decompose');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Future Road Map 2020–2054"
        title="未来ロードマップ — 要素分解"
        description="テクノロジー・マーケット・リテラシー・カルチャーの4軸で、2020年代から2050年代までの未来キーワードを時代ごとに分解した統合ロードマップ。各時代×軸を因子、その中のキーワード群をサブ因子として扱い、未来の急所を時系列で読み解きます。"
      />

      {/* サマリー & アクション */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tag color="#22d3ee">7 時代 (2020–2054)</Tag>
        <Tag color="#a3e635">4 軸の要素分解</Tag>
        <Tag color="#8b5cf6">{totalKeywords().toLocaleString()} キーワード</Tag>
        <Tag color="#f59e0b">Tech Effect ＋ PEST 統合</Tag>
        <button
          onClick={openAnalysis}
          className="ml-auto flex items-center gap-2 rounded-xl bg-accent-cyan/15 px-4 py-2 text-xs font-semibold text-accent-cyan ring-1 ring-accent-cyan/40 transition hover:bg-accent-cyan/25"
        >
          <Microscope size={15} />
          このロードマップを分解分析する
        </button>
      </div>

      {/* 検索 */}
      <Panel className="mb-6">
        <div className="flex items-center gap-3 p-4">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードを横断検索（例: 核融合 / マインドアップロード / EV）"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              クリア
            </button>
          )}
        </div>
      </Panel>

      {filtered ? (
        <Panel
          title={`検索結果: ${filtered.length} 件`}
          icon={<Search size={16} />}
          subtitle={`「${query}」を含むキーワード`}
        >
          <div className="grid gap-2 p-4 md:grid-cols-2">
            {filtered.map(({ axis, era: e, kw }) => {
              const meta = ROADMAP_AXIS_META[axis];
              return (
                <div
                  key={`${e}-${axis}-${kw.no}`}
                  className="glass-soft rounded-xl p-3"
                  style={{ borderLeft: `3px solid ${meta.color}` }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100">{kw.name}</span>
                    <span className="text-[10px] text-slate-500">{e}</span>
                  </div>
                  <Tag color={meta.color}>{meta.label}</Tag>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{kw.summary}</p>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="p-2 text-sm text-slate-400">該当するキーワードが見つかりませんでした。</p>
            )}
          </div>
        </Panel>
      ) : (
        <>
          {/* 時代タイムライン */}
          <div className="mb-6 flex flex-wrap gap-2">
            {ROADMAP_ERAS.map((e, i) => {
              const active = e.era === activeEra;
              return (
                <button
                  key={e.era}
                  onClick={() => setActiveEra(e.era)}
                  className={`relative flex flex-col items-start rounded-xl px-4 py-2.5 text-left transition ${
                    active
                      ? 'bg-accent-cyan/15 ring-1 ring-accent-cyan/40'
                      : 'glass-soft hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`text-sm font-bold tabular ${
                      active ? 'text-accent-cyan' : 'text-slate-200'
                    }`}
                  >
                    {e.era}
                  </span>
                  <span className="text-[10px] text-slate-500">第{i + 1}期</span>
                </button>
              );
            })}
          </div>

          {/* 4軸マトリクス */}
          <div className="grid gap-4 lg:grid-cols-2">
            {AXIS_ORDER.map((axis) => (
              <AxisColumn key={axis} axis={axis} eraKey={era.era} />
            ))}
          </div>
        </>
      )}

      {/* PEST */}
      <Panel
        className="mt-6"
        title="PEST 分析（政治・経済・社会・技術）"
        icon={<Globe2 size={16} />}
        subtitle="年次ごとのマクロ環境スナップショット"
        action={
          <button
            onClick={() => setShowPest((v) => !v)}
            className="text-xs text-accent-cyan hover:underline"
          >
            {showPest ? '閉じる' : '開く'}
          </button>
        }
      >
        {showPest && (
          <div className="space-y-4 p-4">
            {ROADMAP_PEST.map((p) => (
              <div key={p.year} className="glass-soft rounded-xl p-4">
                <div className="mb-3 text-sm font-bold text-slate-100">{p.year}</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {(
                    [
                      ['politics', 'P 政治', '#f59e0b'],
                      ['economy', 'E 経済', '#a3e635'],
                      ['society', 'S 社会', '#ec4899'],
                      ['technology', 'T 技術', '#22d3ee'],
                    ] as const
                  ).map(([key, label, color]) => (
                    <div key={key}>
                      <div className="mb-1.5">
                        <Tag color={color}>{label}</Tag>
                      </div>
                      <ul className="space-y-1.5">
                        {p[key].slice(0, 5).map((it, idx) => (
                          <li key={idx} className="text-xs leading-relaxed text-slate-400">
                            <span className="font-medium text-slate-200">{it.keyword}</span>
                            {it.desc && <span className="text-slate-500">: {it.desc}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AxisColumn({ axis, eraKey }: { axis: RoadmapAxisKey; eraKey: string }) {
  const meta = ROADMAP_AXIS_META[axis];
  const Icon = AXIS_ICON[axis];
  const era = ROADMAP_ERAS.find((e) => e.era === eraKey)!;
  const items = era.axes[axis];
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <Panel
      title={meta.label}
      icon={<Icon size={16} />}
      subtitle={`${items.length} キーワード`}
    >
      <div className="max-h-[28rem] space-y-1.5 overflow-y-auto p-3">
        {items.map((kw) => {
          const open = openId === kw.no;
          const hasEffect =
            axis === 'technology' &&
            ((kw.posIndustries?.length ?? 0) > 0 || (kw.negIndustries?.length ?? 0) > 0);
          return (
            <motion.div
              key={kw.no}
              layout
              className="rounded-xl"
              style={{ borderLeft: `3px solid ${meta.color}`, background: 'rgba(255,255,255,0.02)' }}
            >
              <button
                onClick={() => setOpenId(open ? null : kw.no)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left"
              >
                <span
                  className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold tabular"
                  style={{ background: `${meta.color}22`, color: meta.color }}
                >
                  {kw.no}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-slate-100">{kw.name}</span>
                  {!open && (
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {kw.summary}
                    </span>
                  )}
                </span>
              </button>
              {open && (
                <div className="px-3 pb-3 pl-10">
                  <p className="text-xs leading-relaxed text-slate-400">{kw.summary}</p>
                  {axis === 'technology' && kw.posMarket && (
                    <p className="mt-2 text-xs leading-relaxed text-emerald-300/90">
                      <span className="font-semibold">＋市場影響:</span> {kw.posMarket}
                    </p>
                  )}
                  {axis === 'technology' && kw.negMarket && (
                    <p className="mt-1 text-xs leading-relaxed text-rose-300/90">
                      <span className="font-semibold">−市場影響:</span> {kw.negMarket}
                    </p>
                  )}
                  {hasEffect && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {(kw.posIndustries?.length ?? 0) > 0 && (
                        <div>
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                            <ArrowUpRight size={11} /> 追い風業界
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {kw.posIndustries!.map((ind, i) => (
                              <span
                                key={i}
                                className="rounded-md px-1.5 py-0.5 text-[10px]"
                                style={{
                                  background: `${LEVEL_COLOR[ind.level] ?? '#64748b'}1f`,
                                  color: LEVEL_COLOR[ind.level] ?? '#94a3b8',
                                }}
                              >
                                {ind.industry}
                                {ind.level && `（${ind.level}）`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(kw.negIndustries?.length ?? 0) > 0 && (
                        <div>
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                            <ArrowDownRight size={11} /> 逆風業界
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {kw.negIndustries!.map((ind, i) => (
                              <span
                                key={i}
                                className="rounded-md px-1.5 py-0.5 text-[10px]"
                                style={{
                                  background: `${LEVEL_COLOR[ind.level] ?? '#64748b'}1f`,
                                  color: LEVEL_COLOR[ind.level] ?? '#94a3b8',
                                }}
                              >
                                {ind.industry}
                                {ind.level && `（${ind.level}）`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}
