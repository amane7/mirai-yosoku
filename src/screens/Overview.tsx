import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Network,
  Waves,
  Target,
  Zap,
  Route,
  RefreshCw,
  FileText,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Orbit,
  Microscope,
  Map as MapIcon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_META } from '../lib/types';
import { Panel, ScoreBar, Tag } from '../components/ui';

const FEATURES = [
  { to: '/sinic', icon: Orbit, title: 'SINIC Theory', jp: 'SINIC理論', desc: '半世紀を言い当てたオムロンの未来学。本アプリの思想の源流。', color: '#a78bfa' },
  { to: '/roadmap', icon: MapIcon, title: 'Future Road Map', jp: '未来ロードマップ', desc: '4軸×7時代、1,400キーワードを要素分解した統合ロードマップ。', color: '#22d3ee' },
  { to: '/map', icon: Network, title: 'Future Map', jp: '因果ネットワーク', desc: '未来因子のつながりを俯瞰し、橋渡し因子を発見する。', color: '#22d3ee' },
  { to: '/sankey', icon: Waves, title: 'Sankey Timeline', jp: '未来フロー', desc: '現在から未来へ至る因果の流れを多段で可視化する。', color: '#3b82f6' },
  { to: '/ranking', icon: Target, title: 'Criticality', jp: '急所ランキング', desc: 'Future Criticality Score で未来の急所を順位化する。', color: '#8b5cf6' },
  { to: '/decompose', icon: Microscope, title: 'Decomposition', jp: '分解分析', desc: 'FCSの因数分解・感応度・サブ因子で粒度を一段深掘りする。', color: '#a3e635' },
  { to: '/knockout', icon: Zap, title: 'Knockout Sim', jp: '反実仮想', desc: '「もしこの因子が消えたら？」で未来の崩れ方を検証する。', color: '#f59e0b' },
  { to: '/backcast', icon: Route, title: 'Backcasting', jp: 'ロードマップ', desc: '望ましい未来から逆算し、今の打ち手に落とす。', color: '#10b981' },
  { to: '/loops', icon: RefreshCw, title: 'Causal Loops', jp: '因果ループ', desc: '好循環・悪循環のフィードバック構造を読む。', color: '#ec4899' },
];

export function Overview() {
  const { project, scoreResult, selectFactor, targetYear } = useStore();
  const top5 = scoreResult.ranking.slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 p-8 md:p-10"
        style={{
          background:
            'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(139,92,246,0.10) 60%, rgba(236,72,153,0.06))',
        }}
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-violet/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-accent-cyan/10 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-accent-cyan">
            <Sparkles size={13} /> 意思決定支援 OS
          </div>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight text-slate-50 md:text-[40px]">
            未来は、点ではなく<br />
            <span className="gradient-text">ネットワーク</span>でできている。
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
            {project.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/map"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-cyan px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-cyan-300"
            >
              因果ネットワークを見る <ArrowRight size={16} />
            </Link>
            <Link
              to="/knockout"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              <Zap size={15} /> 反実仮想を試す
            </Link>
            <Link
              to="/sinic"
              className="inline-flex items-center gap-2 rounded-xl border border-accent-violet/30 bg-accent-violet/10 px-5 py-2.5 text-sm font-semibold text-accent-violet transition hover:bg-accent-violet/20"
            >
              <Orbit size={15} /> SINIC理論を学ぶ
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { v: project.factors.length, l: '未来因子', c: '#22d3ee' },
          { v: project.edges.length, l: '因果関係', c: '#3b82f6' },
          { v: project.scenarios.length, l: 'シナリオ', c: '#8b5cf6' },
          { v: `~${project.horizonEnd}`, l: '想定ホライズン', c: '#10b981' },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="glass card-hover rounded-2xl px-5 py-5"
          >
            <div className="text-3xl font-bold tabular" style={{ color: s.c }}>
              {s.v}
            </div>
            <div className="mt-1 text-xs text-slate-400">{s.l}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top criticality */}
        <Panel
          className="lg:col-span-1"
          title="未来の急所 Top 5"
          subtitle={`Future Criticality Score · 目標年 ${targetYear}`}
          icon={<TrendingUp size={16} />}
          action={
            <Link to="/ranking" className="text-xs text-accent-cyan hover:underline">
              全て見る
            </Link>
          }
        >
          <div className="space-y-3 p-5">
            {top5.map((r, i) => {
              const meta = CATEGORY_META[r.factor.category];
              return (
                <Link
                  key={r.factor.id}
                  to="/ranking"
                  onClick={() => selectFactor(r.factor.id)}
                  className="block rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-accent-cyan/30 hover:bg-white/[0.04]"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-white/5 text-xs font-bold text-slate-300">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-100">{r.factor.name}</span>
                      <Tag color={meta.color} soft={meta.soft}>
                        {meta.label}
                      </Tag>
                    </div>
                    <span className="tabular text-sm font-bold" style={{ color: meta.color }}>
                      {r.scores.futureCriticality.toFixed(2)}
                    </span>
                  </div>
                  <ScoreBar value={r.scores.futureCriticality} color={meta.color} />
                </Link>
              );
            })}
          </div>
        </Panel>

        {/* Feature grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
            >
              <Link
                to={f.to}
                className="glass card-hover group flex h-full flex-col rounded-2xl p-5"
              >
                <div
                  className="mb-3 grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: `${f.color}1f`, color: f.color }}
                >
                  <f.icon size={20} />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">{f.title}</h3>
                  <span className="text-[10px] text-slate-500">{f.jp}</span>
                </div>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">{f.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-accent-cyan opacity-0 transition group-hover:opacity-100">
                  開く <ArrowRight size={13} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Report CTA */}
      <Link
        to="/report"
        className="glass card-hover mt-6 flex items-center justify-between rounded-2xl p-5"
      >
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-violet/15 text-accent-violet">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">経営層向け 1枚サマリー</h3>
            <p className="text-xs text-slate-400">重要因子・示唆・推奨打ち手を自動生成します。</p>
          </div>
        </div>
        <ArrowRight size={18} className="text-slate-400" />
      </Link>
    </div>
  );
}
