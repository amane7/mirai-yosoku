import { NavLink } from 'react-router-dom';
import {
  Network,
  Waves,
  Target,
  Zap,
  Route,
  RefreshCw,
  FileText,
  LayoutDashboard,
  Pencil,
  Columns,
  Orbit,
  Microscope,
  Map as MapIcon,
} from 'lucide-react';
import { useStore, PROJECTS } from '../store/useStore';

const NAV = [
  { to: '/', label: 'Overview', jp: 'ダッシュボード', icon: LayoutDashboard, end: true },
  { to: '/sinic', label: 'SINIC Theory', jp: 'SINIC理論', icon: Orbit },
  { to: '/roadmap', label: 'Road Map', jp: '未来ロードマップ', icon: MapIcon },
  { to: '/map', label: 'Future Map', jp: '因果ネットワーク', icon: Network },
  { to: '/editor', label: 'Network Editor', jp: 'エディタ', icon: Pencil },
  { to: '/sankey', label: 'Timeline Flow', jp: '未来フロー', icon: Waves },
  { to: '/ranking', label: 'Criticality', jp: '急所ランキング', icon: Target },
  { to: '/decompose', label: 'Decomposition', jp: '分解分析', icon: Microscope },
  { to: '/knockout', label: 'Knockout Sim', jp: '反実仮想', icon: Zap },
  { to: '/compare', label: 'Comparison', jp: 'シナリオ比較', icon: Columns },
  { to: '/backcast', label: 'Backcasting', jp: 'ロードマップ', icon: Route },
  { to: '/loops', label: 'Causal Loops', jp: '因果ループ', icon: RefreshCw },
  { to: '/report', label: 'Executive Report', jp: '経営サマリー', icon: FileText },
];

export function Sidebar() {
  const { projectId, setProject, project } = useStore();

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-white/5 bg-ink-800/60 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-cyan/30 to-accent-violet/30 ring-1 ring-white/10">
          <BrandMark />
        </div>
        <div>
          <div className="text-[15px] font-bold leading-tight text-slate-50">Future Nexus</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent-cyan/70">
            OS
          </div>
        </div>
      </div>

      {/* Project selector */}
      <div className="px-4 pb-4">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          プロジェクト
        </label>
        <div className="relative">
          <select
            value={projectId}
            onChange={(e) => setProject(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-ink-700/80 px-3 py-2.5 pr-8 text-sm font-medium text-slate-100 outline-none transition hover:border-accent-cyan/40 focus:border-accent-cyan/60"
          >
            {PROJECTS.map((p) => (
              <option key={p.id} value={p.id} className="bg-ink-700">
                {p.name}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-500">{project.tagline}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, label, jp, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'bg-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={isActive ? 'text-accent-cyan' : 'text-slate-500 group-hover:text-slate-300'}
                />
                <div className="flex flex-1 flex-col leading-tight">
                  <span className="font-medium">{label}</span>
                  <span className="text-[10px] text-slate-500">{jp}</span>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 px-5 py-4">
        <p className="text-[10px] leading-relaxed text-slate-500">
          未来は、点ではなく<br />
          <span className="text-slate-300">ネットワーク</span>でできている。
        </p>
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <circle cx="9" cy="11" r="2.6" fill="#22d3ee" />
      <circle cx="23" cy="8" r="2" fill="#67e8f9" />
      <circle cx="16" cy="21" r="3" fill="#a78bfa" />
      <circle cx="24" cy="23" r="1.8" fill="#f0abfc" />
      <path
        d="M9 11 L16 21 M23 8 L16 21 M16 21 L24 23"
        stroke="#67e8f9"
        strokeWidth="1.4"
        opacity="0.8"
      />
    </svg>
  );
}
