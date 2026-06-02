import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_META } from '../lib/types';
import { PageHeader, Panel } from '../components/ui';

export function Loops() {
  const { project } = useStore();

  return (
    <div>
      <PageHeader
        eyebrow="Causal Loops"
        title="因果ループ"
        description="Sankeyでは扱えない循環構造（フィードバックループ）を表現します。変化を強める好循環（Reinforcing）と、変化を打ち消す悪循環・抑制ループ（Balancing）を読み解き、介入点を探します。"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {project.loops.map((loop, idx) => {
          const reinforcing = loop.type === 'reinforcing';
          const accent = reinforcing ? '#10b981' : '#f59e0b';
          const nameOf = (id: string) =>
            project.factors.find((f) => f.id === id)?.name ?? id;
          return (
            <motion.div
              key={loop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Panel
                title={loop.name}
                icon={
                  reinforcing ? (
                    <TrendingUp size={16} className="text-accent-green" />
                  ) : (
                    <TrendingDown size={16} className="text-accent-amber" />
                  )
                }
                action={
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ color: accent, background: `${accent}1f`, border: `1px solid ${accent}44` }}
                  >
                    {reinforcing ? '好循環 R' : '抑制ループ B'}
                  </span>
                }
              >
                <div className="p-5">
                  {/* Loop ring */}
                  <LoopRing nodes={loop.nodes} project={project} accent={accent} />

                  {/* Flow chips */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {loop.nodes.map((id, i) => {
                      const meta = CATEGORY_META[
                        project.factors.find((f) => f.id === id)?.category ?? 'Technology'
                      ];
                      const last = i === loop.nodes.length - 1;
                      return (
                        <span key={i} className="flex items-center gap-1.5">
                          <span
                            className="rounded-lg px-2 py-1 text-[11px] font-medium"
                            style={{ color: meta.color, background: meta.soft }}
                          >
                            {nameOf(id)}
                          </span>
                          {!last && <ArrowRight size={12} className="text-slate-600" />}
                        </span>
                      );
                    })}
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-slate-400">{loop.narrative}</p>
                </div>
              </Panel>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LoopRing({
  nodes,
  project,
  accent,
}: {
  nodes: string[];
  project: ReturnType<typeof useStore.getState>['project'];
  accent: string;
}) {
  // unique nodes for circular placement
  const uniq = nodes.filter((id, i) => nodes.indexOf(id) === i);
  const cx = 150;
  const cy = 110;
  const r = 78;
  const pts = uniq.map((id, i) => {
    const a = (i / uniq.length) * Math.PI * 2 - Math.PI / 2;
    return { id, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  return (
    <svg viewBox="0 0 300 220" className="w-full">
      <defs>
        <marker id={`arr-${accent.replace('#', '')}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={accent} />
        </marker>
      </defs>
      {pts.map((p, i) => {
        const next = pts[(i + 1) % pts.length];
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2;
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const nx = -dy;
        const ny = dx;
        const len = Math.hypot(nx, ny) || 1;
        const cpx = mx + (nx / len) * 26;
        const cpy = my + (ny / len) * 26;
        return (
          <path
            key={i}
            d={`M ${p.x} ${p.y} Q ${cpx} ${cpy} ${next.x} ${next.y}`}
            fill="none"
            stroke={accent}
            strokeWidth={1.6}
            opacity={0.55}
            markerEnd={`url(#arr-${accent.replace('#', '')})`}
          />
        );
      })}
      {pts.map((p) => {
        const meta =
          CATEGORY_META[project.factors.find((f) => f.id === p.id)?.category ?? 'Technology'];
        return (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={9} fill={meta.color} stroke="#05070d" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
}
