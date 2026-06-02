import { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, { type Core } from 'cytoscape';
import { Network, Layers, Info, Clock, GitCompareArrows } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_META, type FactorCategory } from '../lib/types';
import { PageHeader, Panel, ScoreBar, Pill } from '../components/ui';

const REL_STYLE: Record<string, { color: string; label: string }> = {
  enabler: { color: '#22d3ee', label: '促進' },
  amplifier: { color: '#10b981', label: '増幅' },
  inhibitor: { color: '#ef4444', label: '抑制' },
  dependency: { color: '#f59e0b', label: '依存' },
};

export function FutureMap() {
  const { project, scoreResult, selectedFactorId, selectFactor, knockout, getActiveStory, hasIntervention } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [sizeBy, setSizeBy] = useState<'betweenness' | 'futureCriticality' | 'knockoutImpact'>(
    'betweenness',
  );
  const [activeCats, setActiveCats] = useState<Set<FactorCategory>>(new Set());
  const [year, setYear] = useState<number | null>(null); // null = 全期間
  const [overlay, setOverlay] = useState(true); // Before/After 重ね表示

  const activeStory = getActiveStory();
  const ifActive = hasIntervention() && overlay;

  const cats = useMemo(
    () => Array.from(new Set(project.factors.map((f) => f.category))),
    [project],
  );

  // reset year when project changes
  useEffect(() => setYear(null), [project]);

  const selected = project.factors.find((f) => f.id === selectedFactorId) ?? null;
  const selScore = selectedFactorId ? scoreResult.scores[selectedFactorId] : null;

  useEffect(() => {
    if (!ref.current) return;
    const elements: cytoscape.ElementDefinition[] = [];
    project.factors.forEach((f) => {
      const s = scoreResult.scores[f.id];
      const meta = CATEGORY_META[f.category];
      elements.push({
        data: {
          id: f.id,
          label: f.name,
          color: meta.color,
          size: 26 + (s[sizeBy] ?? 0) * 46,
          cat: f.category,
          tStart: f.timeStart,
          tEnd: f.timeEnd,
        },
      });
    });
    project.edges.forEach((e) => {
      elements.push({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          color: REL_STYLE[e.relationshipType]?.color ?? '#64748b',
          width: 1 + e.weight * 4,
          dashed: e.status === 'hypothesis',
        },
      });
    });

    let disposed = false;
    const cy = cytoscape({
      container: ref.current,
      elements,
      minZoom: 0.3,
      maxZoom: 2.5,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            label: 'data(label)',
            width: 'data(size)',
            height: 'data(size)',
            'font-size': 11,
            'font-weight': 600,
            color: '#e2e8f0',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-outline-color': '#05070d',
            'text-outline-width': 2,
            'border-width': 2,
            'border-color': '#05070d',
            'overlay-opacity': 0,
          },
        },
        {
          selector: 'node:selected',
          style: { 'border-width': 3, 'border-color': '#ffffff' },
        },
        {
          selector: 'edge',
          style: {
            width: 'data(width)',
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.9,
            'curve-style': 'bezier',
            opacity: 0.5,
            'line-style': 'solid',
          },
        },
        { selector: 'edge[?dashed]', style: { 'line-style': 'dashed', opacity: 0.35 } },
        { selector: '.faded', style: { opacity: 0.08 } },
        { selector: '.hl', style: { opacity: 1 } },
        { selector: 'node.hl', style: { 'z-index': 99 } },
        // ---- IF overlay: 取り除かれた因子（ゴースト表示） ----
        {
          selector: 'node.removed',
          style: {
            'background-opacity': 0.12,
            'border-color': '#ef4444',
            'border-width': 2,
            'border-style': 'dashed',
            color: '#94a3b8',
            'background-color': '#ef4444',
          },
        },
        {
          selector: 'node.weakened',
          style: { 'background-opacity': 0.5, 'border-color': '#f59e0b', 'border-style': 'dashed' },
        },
        {
          selector: 'edge.removed',
          style: { 'line-style': 'dashed', 'line-color': '#ef4444', 'target-arrow-color': '#ef4444', opacity: 0.18 },
        },
      ],
    });

    cy.on('tap', 'node', (evt) => selectFactor(evt.target.id()));
    cy.on('tap', (evt) => {
      if (evt.target === cy) selectFactor(null);
    });

    cyRef.current = cy;

    // Defer the (animated) layout to a microtask so StrictMode's immediate
    // unmount can cancel it before cose's async callbacks touch a destroyed core.
    let layout: cytoscape.Layouts | null = null;
    const raf = requestAnimationFrame(() => {
      if (disposed || cy.destroyed()) return;
      layout = cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 700,
        nodeRepulsion: () => 9000,
        idealEdgeLength: () => 120,
        gravity: 0.3,
        padding: 40,
      } as any);
      layout.run();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      try {
        layout?.stop();
      } catch {
        /* noop */
      }
      if (!cy.destroyed()) cy.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, sizeBy]);

  // Highlight selection + category filter + IF overlay
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().removeClass('faded hl removed weakened');

      // ---- IF overlay: 取り除かれた/弱まった因子をゴースト化 ----
      if (ifActive) {
        cy.nodes().forEach((n) => {
          const st = knockout.strength[n.id()] ?? 1;
          if (st === 0) n.addClass('removed');
          else if (st < 1) n.addClass('weakened');
        });
        cy.edges().forEach((e) => {
          const sStr = knockout.strength[e.data('source')] ?? 1;
          const tStr = knockout.strength[e.data('target')] ?? 1;
          if (sStr === 0 || tStr === 0) e.addClass('removed');
        });
      }

      // category filter
      if (activeCats.size > 0) {
        cy.nodes().forEach((n) => {
          if (!activeCats.has(n.data('cat'))) n.addClass('faded');
        });
      }
      // time horizon filter: dim factors not active in the selected year
      if (year !== null) {
        cy.nodes().forEach((n) => {
          if (year < n.data('tStart') || year > n.data('tEnd')) n.addClass('faded');
        });
      }
      if (selectedFactorId) {
        const node = cy.getElementById(selectedFactorId);
        const neighborhood = node.closedNeighborhood();
        cy.elements().addClass('faded');
        neighborhood.removeClass('faded').addClass('hl');
        cy.getElementById(selectedFactorId).select();
      }
    });
  }, [selectedFactorId, activeCats, year, ifActive, knockout]);

  const toggleCat = (c: FactorCategory) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Future Map"
        title="因果ネットワーク"
        description="未来因子のつながりを俯瞰します。ノードの大きさは指標値、線の太さは影響度、矢印は因果の向き。ノードをクリックすると、その因子を媒介とする経路だけが浮かび上がります。"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Panel
          title="ネットワークビュー"
          icon={<Network size={16} />}
          action={
            <div className="flex flex-wrap items-center gap-1">
              {(['betweenness', 'futureCriticality', 'knockoutImpact'] as const).map((k) => (
                <Pill key={k} active={sizeBy === k} onClick={() => setSizeBy(k)}>
                  {k === 'betweenness' ? '媒介性' : k === 'futureCriticality' ? 'FCS' : 'KO影響'}
                </Pill>
              ))}
              {hasIntervention() && (
                <button
                  onClick={() => setOverlay((v) => !v)}
                  className={`ml-1 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition ${
                    overlay
                      ? 'bg-accent-red/15 text-accent-red ring-1 ring-accent-red/40'
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                  title="IFストーリーで取り除かれた因子をゴースト表示"
                >
                  <GitCompareArrows size={13} /> IF重ね表示
                </button>
              )}
            </div>
          }
        >
          {ifActive && (
            <div className="flex flex-wrap items-center gap-2 border-b border-white/5 bg-accent-red/[0.05] px-5 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: activeStory.color }}>
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: activeStory.color }} />
                {activeStory.builtin ? '未保存の介入' : activeStory.name}
              </span>
              <span className="text-slate-400">
                — 赤い破線＝<b className="text-accent-red">「なかったら」</b>取り除かれた因子と、その因果が消える様子を重ねています
              </span>
            </div>
          )}
          <div className="px-5 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Layers size={12} /> カテゴリ:
              </span>
              {cats.map((c) => {
                const meta = CATEGORY_META[c];
                const active = activeCats.size === 0 || activeCats.has(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium transition"
                    style={{
                      color: active ? meta.color : '#64748b',
                      background: active ? meta.soft : 'transparent',
                      border: `1px solid ${active ? meta.color + '44' : '#33415544'}`,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {/* Time horizon slider */}
            <div className="mt-3 flex items-center gap-3 border-t border-white/5 pt-3">
              <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                <Clock size={12} /> 時間軸:
              </span>
              <span className="tabular w-12 shrink-0 text-xs font-semibold text-accent-cyan">
                {year === null ? '全期間' : year}
              </span>
              <input
                type="range"
                min={project.horizonStart}
                max={project.horizonEnd}
                step={1}
                value={year ?? project.horizonStart}
                onChange={(e) => setYear(Number(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={() => setYear(null)}
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                  year === null
                    ? 'bg-accent-cyan/15 text-accent-cyan'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                全期間
              </button>
            </div>
          </div>
          <div ref={ref} className="h-[560px] w-full" />
          <div className="flex flex-wrap items-center gap-4 border-t border-white/5 px-5 py-3">
            {Object.entries(REL_STYLE).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="inline-block h-0.5 w-5 rounded" style={{ background: v.color }} />
                {v.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="inline-block h-0.5 w-5 rounded border-t border-dashed border-slate-400" />
              仮説（未レビュー）
            </span>
          </div>
        </Panel>

        {/* Detail panel */}
        <div>
          {selected && selScore ? (
            <FactorCard fid={selected.id} />
          ) : (
            <Panel title="因子の詳細" icon={<Info size={16} />}>
              <div className="p-5 text-sm text-slate-400">
                ノードをクリックすると、ここに因子の詳細スコアと、影響先・依存先が表示されます。
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

export function FactorCard({ fid }: { fid: string }) {
  const { project, scoreResult, selectFactor } = useStore();
  const f = project.factors.find((x) => x.id === fid)!;
  const s = scoreResult.scores[fid];
  const meta = CATEGORY_META[f.category];
  const outs = project.edges.filter((e) => e.source === fid);
  const ins = project.edges.filter((e) => e.target === fid);
  const name = (id: string) => project.factors.find((x) => x.id === id)?.name ?? id;

  return (
    <Panel
      title={f.name}
      subtitle={meta.label}
      icon={<span className="inline-block h-3 w-3 rounded-full" style={{ background: meta.color }} />}
    >
      <div className="space-y-4 p-5">
        <p className="text-xs leading-relaxed text-slate-400">{f.description}</p>

        <div className="grid grid-cols-2 gap-2">
          <Mini label="重要化時期" value={`${f.timeStart}–${f.timeEnd}`} />
          <Mini label="ピーク年" value={`${f.timePeak}`} />
          <Mini label="成熟度" value={`${Math.round(f.maturity * 100)}%`} />
          <Mini label="不確実性" value={`${Math.round(f.uncertainty * 100)}%`} />
        </div>

        <div className="space-y-2.5">
          <ScoreBar label="中心媒介性" value={s.betweenness} color="#22d3ee" pct />
          <ScoreBar label="直接影響度" value={s.directInfluence} color="#3b82f6" pct />
          <ScoreBar label="ノックアウト影響" value={s.knockoutImpact} color="#f59e0b" pct />
          <ScoreBar label="ボトルネック度" value={s.bottleneck} color="#ef4444" pct />
          <ScoreBar label="Future Criticality" value={s.futureCriticality} color="#a78bfa" pct />
        </div>

        {f.evidence && f.evidence.length > 0 && (
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              根拠
            </div>
            <ul className="space-y-1">
              {f.evidence.map((ev) => (
                <li key={ev} className="text-[11px] text-slate-400">
                  · {ev}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              主な影響先 ({outs.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {outs.length ? (
                outs.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => selectFactor(e.target)}
                    className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-accent-cyan/15 hover:text-accent-cyan"
                  >
                    {name(e.target)} <span className="text-slate-500">{e.weight.toFixed(2)}</span>
                  </button>
                ))
              ) : (
                <span className="text-[11px] text-slate-500">—</span>
              )}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              主な依存先 ({ins.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ins.length ? (
                ins.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => selectFactor(e.source)}
                    className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-accent-amber/15 hover:text-accent-amber"
                  >
                    {name(e.source)} <span className="text-slate-500">{e.weight.toFixed(2)}</span>
                  </button>
                ))
              ) : (
                <span className="text-[11px] text-slate-500">—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft rounded-lg px-3 py-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="tabular text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}
