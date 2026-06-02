import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Orbit, Layers, Sparkles, ChevronRight } from 'lucide-react';
import { PageHeader, Panel, Tag, Pill } from '../components/ui';
import {
  SINIC_STAGES,
  SINIC_NOW_YEAR,
  stageAtYear,
  THEORY_PILLARS,
  TRIAD_NODES,
  TRIAD_EDGES,
  type SinicStage,
} from '../lib/sinic';

const KIND_LABEL: Record<SinicStage['kind'], string> = {
  past: '過去',
  present: '現在',
  future: '未来',
  beyond: '次サイクル',
};

export function Sinic() {
  const nowStage = stageAtYear(SINIC_NOW_YEAR);
  const [selectedId, setSelectedId] = useState<string>(nowStage.id);
  const [triadMode, setTriadMode] = useState<'original' | 'update'>('update');
  const selected = SINIC_STAGES.find((s) => s.id === selectedId) ?? nowStage;

  return (
    <div>
      <PageHeader
        eyebrow="SINIC THEORY · 1970"
        title="SINIC理論 — 半世紀を言い当てた未来学"
        description="Seed-Innovation and Need-Impetus Cyclic Evolution。科学が技術の種となり、技術が社会を革新し、社会が技術にニーズを与え、技術が科学を刺激する——その円環的進化で、原始社会から自律社会までの10段階を貫いた未来予測理論。本アプリの「未来＝因果ネットワーク」という思想の源流をここに据える。"
      />

      {/* SINIC定義カード */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="px-5 py-5">
            <div className="flex items-center gap-2 text-accent-cyan">
              <Sparkles size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">SINIC とは</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              <strong className="text-slate-100">S</strong>eed-<strong className="text-slate-100">I</strong>nnovation
              and <strong className="text-slate-100">N</strong>eed-<strong className="text-slate-100">I</strong>mpetus{' '}
              <strong className="text-slate-100">C</strong>yclic Evolution of technological innovation。
              <br />
              「科学が技術の<span className="text-accent-cyan">種</span>となり、技術は社会を
              <span className="text-accent-violet">革新</span>する。そして社会は技術に新たな
              <span className="text-accent-amber">ニーズ</span>を与え、技術はその社会的価値によって、さらなる科学の発展に刺激を与える。そのような円環的な技術革新の進化」
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              1970年、オムロン創業者・立石一真と中央研究所により構築。属人的な「予言」ではなく、人類史全体を俯瞰した「理論」にまとめた点に普遍的価値がある。本書ではオープン・ソース化し、社会と共に未来を創ることを掲げている。
            </p>
          </div>
        </Panel>
        <Panel>
          <div className="px-5 py-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              現在地（{SINIC_NOW_YEAR}年）
            </div>
            <div className="mt-2 text-2xl font-bold" style={{ color: nowStage.color }}>
              {nowStage.name}
            </div>
            <div className="mt-1 text-xs text-slate-400">{nowStage.era}</div>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">{nowStage.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag color="#22d3ee">情報最適化</Tag>
              <Tag color="#f59e0b">社会課題最適化</Tag>
              <Tag color="#a78bfa">未来予兆の最適化</Tag>
            </div>
          </div>
        </Panel>
      </div>

      {/* 10段階タイムライン */}
      <Panel
        title="10段階の社会発展区分"
        subtitle="原始社会 → 自律社会（1周期）。円錐スパイラルを登るほど発展は加速する。"
        icon={<Layers size={18} />}
        className="mb-6"
      >
        <div className="px-5 py-5">
          <StageTimeline stages={SINIC_STAGES} selectedId={selectedId} onSelect={setSelectedId} nowYear={SINIC_NOW_YEAR} />
          <div className="mt-5">
            <StageDetail stage={selected} isNow={selected.id === nowStage.id} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 円環トライアド */}
        <Panel
          title="科学・技術・社会の円環的相互作用"
          subtitle="中心の「人間の意欲」が原動力。3者をつなぐ円環が社会を進化させる。"
          icon={<Orbit size={18} />}
          action={
            <div className="flex gap-1.5">
              <Pill active={triadMode === 'original'} onClick={() => setTriadMode('original')}>
                1970 原型
              </Pill>
              <Pill active={triadMode === 'update'} onClick={() => setTriadMode('update')}>
                アップデート
              </Pill>
            </div>
          }
        >
          <div className="px-5 py-5">
            <TriadDiagram mode={triadMode} />
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              {triadMode === 'original'
                ? '原型では円環は技術を中心に回り、科学⇔社会の関係は点線（未顕在）だった。原動力は「進歩志向意欲」。'
                : '半世紀後のアップデート：科学⇔社会が実線化（可能性・夢・倫理／ELSI）。原動力は「共生志向」へ、社会への「適応」は「参画」へ。'}
            </p>
          </div>
        </Panel>

        {/* 価値観座標プレーン */}
        <Panel
          title="価値観の座標平面と社会進化"
          subtitle="心⇔物 × 集団⇔個 の2軸。人類史はこの面を円錐スパイラルで登る。"
          icon={<Compass size={18} />}
        >
          <div className="px-5 py-5">
            <ValuePlane stages={SINIC_STAGES} selectedId={selectedId} onSelect={setSelectedId} />
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              原始（心・集団）から物・個へ向かい、最適化社会で再び心へ、行き過ぎた「個」を是正して「集団（つながり）」へ回帰しはじめる。現在はこの1周期の<strong className="text-slate-200">最終1/4の弧</strong>。
            </p>
          </div>
        </Panel>
      </div>

      {/* 3つの理論的特徴 */}
      <Panel
        title="3つの理論的特徴とアップデート"
        subtitle="基本構造は不易のまま。半世紀の価値観変化に合わせて理論を磨き直した。"
        icon={<Sparkles size={18} />}
        className="mt-6"
      >
        <div className="grid gap-px overflow-hidden md:grid-cols-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {THEORY_PILLARS.map((p) => (
            <div key={p.id} className="bg-ink-800/40 px-5 py-5">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-cyan/15 text-xs font-bold text-accent-cyan">
                  {p.num}
                </span>
                <h4 className="text-sm font-semibold text-slate-100">{p.title}</h4>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">1970 原型</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{p.original}</p>
              </div>
              <div className="mt-3 rounded-lg border border-accent-violet/20 bg-accent-violet/5 p-3">
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent-violet">
                  <ChevronRight size={12} /> アップデート
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{p.update}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ============================================================================
// 10段階タイムライン
// ============================================================================
function StageTimeline({
  stages,
  selectedId,
  onSelect,
  nowYear,
}: {
  stages: SinicStage[];
  selectedId: string;
  onSelect: (id: string) => void;
  nowYear: number;
}) {
  return (
    <div className="flex w-full gap-1.5 overflow-x-auto pb-2">
      {stages.map((s) => {
        const active = s.id === selectedId;
        const isNow = nowYear >= s.yearStart && nowYear <= s.yearEnd;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`group relative flex min-w-[110px] flex-1 flex-col items-start rounded-xl border p-3 text-left transition ${
              active ? 'border-white/30' : 'border-white/8 hover:border-white/20'
            }`}
            style={{
              background: active ? `${s.color}1f` : 'rgba(255,255,255,0.02)',
              boxShadow: active ? `inset 0 0 0 1px ${s.color}55` : undefined,
            }}
          >
            <span
              className="mb-1.5 h-1 w-full rounded-full"
              style={{ background: s.color, opacity: active ? 1 : 0.5 }}
            />
            <span className="text-[10px] font-medium text-slate-500">{KIND_LABEL[s.kind]}</span>
            <span className="text-[13px] font-bold leading-tight text-slate-100">{s.name}</span>
            <span className="mt-0.5 text-[10px] text-slate-400">{s.era}</span>
            {isNow && (
              <span className="absolute -top-1.5 right-2 rounded-full bg-accent-cyan px-1.5 py-0.5 text-[8px] font-bold text-ink-900">
                NOW
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StageDetail({ stage, isNow }: { stage: SinicStage; isNow: boolean }) {
  return (
    <motion.div
      key={stage.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-white/8 bg-ink-800/40 p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ background: stage.color }} />
        <h3 className="text-lg font-bold text-slate-50">{stage.name}</h3>
        {stage.englishName && <span className="text-xs text-slate-500">{stage.englishName}</span>}
        <span className="text-xs text-slate-400">{stage.era}</span>
        {isNow && <Tag color="#22d3ee">現在地</Tag>}
        <span className="ml-auto text-xs text-slate-400">
          一人当たりGNP：<span className="tabular font-medium text-slate-200">{stage.gnpLabel}</span>
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-200">{stage.summary}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{stage.detail}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <TriCell label="科学（種）" value={stage.science} color="#22d3ee" />
        <TriCell label="技術" value={stage.technology} color="#a78bfa" />
        <TriCell label="社会（革新）" value={stage.society} color="#f59e0b" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {stage.highlights.map((h) => (
          <span
            key={h}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-300"
          >
            {h}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function TriCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border-l-2 bg-white/[0.02] px-3 py-2" style={{ borderColor: color }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
        {label}
      </div>
      <div className="mt-0.5 text-xs leading-snug text-slate-200">{value}</div>
    </div>
  );
}

// ============================================================================
// 円環トライアド SVG
// ============================================================================
function TriadDiagram({ mode }: { mode: 'original' | 'update' }) {
  const W = 460;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const R = 120;
  // 三角配置：科学(上) 技術(右下) 社会(左下)
  const pos: Record<string, { x: number; y: number }> = {
    science: { x: cx, y: cy - R },
    technology: { x: cx + R * 0.92, y: cy + R * 0.6 },
    society: { x: cx - R * 0.92, y: cy + R * 0.6 },
    intent: { x: cx, y: cy + 8 },
  };
  const showUpdate = mode === 'update';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 360 }}>
      <defs>
        <marker id="tri-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 z" fill="#94a3b8" />
        </marker>
        <marker id="tri-arrow-intent" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 z" fill="#ec4899" />
        </marker>
      </defs>

      {TRIAD_EDGES.map((e, i) => {
        if (e.dashedInOriginal && !showUpdate) {
          // 原型では点線で薄く
        }
        const a = pos[e.from];
        const b = pos[e.to];
        // 端点をノード半径ぶん縮める
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const pad = e.fromIntent ? 30 : 40;
        const sx = a.x + (dx / len) * (e.fromIntent ? 18 : 40);
        const sy = a.y + (dy / len) * (e.fromIntent ? 18 : 40);
        const ex = b.x - (dx / len) * pad;
        const ey = b.y - (dy / len) * pad;
        // わずかに曲げる（円環らしさ）
        const mx = (sx + ex) / 2 - dy * 0.12;
        const my = (sy + ey) / 2 + dx * 0.12;
        const dashed = e.dashedInOriginal && !showUpdate;
        const intent = e.fromIntent;
        if (intent && !showUpdate && e.label.includes('参画')) {
          // 原型では「適応」ラベルにしたいが簡略化のため非表示にしない
        }
        return (
          <g key={i} opacity={dashed ? 0.45 : 1}>
            <path
              d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`}
              fill="none"
              stroke={intent ? '#ec4899' : e.dashedInOriginal ? '#67e8f9' : '#94a3b8'}
              strokeWidth={intent ? 1.4 : 2}
              strokeDasharray={dashed ? '4 4' : intent ? '3 3' : undefined}
              markerEnd={intent ? 'url(#tri-arrow-intent)' : 'url(#tri-arrow)'}
              opacity={intent ? 0.7 : 0.85}
            />
          </g>
        );
      })}

      {/* ノード */}
      {TRIAD_NODES.map((n) => {
        const p = pos[n.id];
        const r = n.id === 'intent' ? 30 : 40;
        return (
          <g key={n.id}>
            <circle cx={p.x} cy={p.y} r={r} fill={`${n.color}22`} stroke={n.color} strokeWidth={2} />
            <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize={n.id === 'intent' ? 11 : 14} fontWeight={700} fill={n.color}>
              {n.label}
            </text>
            <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize={7.5} fill="#94a3b8">
              {n.id === 'intent' && showUpdate ? '共生志向' : n.sub.split('（')[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// 価値観座標プレーン（心⇔物 × 集団⇔個）＋ 社会進化スパイラル
// ============================================================================
function ValuePlane({
  stages,
  selectedId,
  onSelect,
}: {
  stages: SinicStage[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const W = 460;
  const H = 380;
  const pad = 36;
  const cx = W / 2;
  const cy = H / 2;
  const sx = (W - pad * 2) / 2; // half-width scale
  const sy = (H - pad * 2) / 2;

  const toXY = (s: SinicStage) => ({
    x: cx + s.coord.heartMatter * sx,
    y: cy + s.coord.groupIndiv * sy,
  });

  // 順路パス（原始→自然）
  const path = useMemo(() => {
    const pts = [...stages].sort((a, b) => a.order - b.order).map(toXY);
    if (pts.length === 0) return '';
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      d += ` Q${mx},${my} ${p1.x},${p1.y}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 380 }}>
      {/* グリッド */}
      <line x1={cx} y1={pad} x2={cx} y2={H - pad} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      <line x1={pad} y1={cy} x2={W - pad} y2={cy} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      {/* 軸ラベル */}
      <text x={pad - 4} y={cy - 6} fontSize={10} fill="#ec4899" fontWeight={700}>心</text>
      <text x={W - pad - 14} y={cy - 6} fontSize={10} fill="#22d3ee" fontWeight={700}>物</text>
      <text x={cx + 6} y={pad + 4} fontSize={10} fill="#a3e635" fontWeight={700}>集団</text>
      <text x={cx + 6} y={H - pad} fontSize={10} fill="#f59e0b" fontWeight={700}>個</text>

      {/* スパイラル順路 */}
      <path d={path} fill="none" stroke="#67e8f9" strokeWidth={1.6} strokeDasharray="5 4" opacity={0.55} />

      {/* ノード */}
      {[...stages]
        .sort((a, b) => a.order - b.order)
        .map((s) => {
          const p = toXY(s);
          const active = s.id === selectedId;
          return (
            <g key={s.id} className="cursor-pointer" onClick={() => onSelect(s.id)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 9 : 5.5}
                fill={s.color}
                stroke={active ? '#fff' : `${s.color}88`}
                strokeWidth={active ? 2 : 1}
                opacity={active ? 1 : 0.85}
              />
              {active && (
                <text x={p.x + 11} y={p.y + 4} fontSize={11} fontWeight={700} fill="#e2e8f0">
                  {s.name}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
