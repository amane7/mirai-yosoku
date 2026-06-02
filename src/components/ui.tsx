import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
  title,
  subtitle,
  icon,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`glass rounded-2xl shadow-panel ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 text-accent-cyan">{icon}</div>}
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-100">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatBadge({
  value,
  label,
  color = '#22d3ee',
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="glass-soft rounded-xl px-4 py-3">
      <div className="text-2xl font-bold tabular" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

export function ScoreBar({
  value,
  color = '#22d3ee',
  label,
  pct,
}: {
  value: number;
  color?: string;
  label?: string;
  pct?: boolean;
}) {
  const w = Math.max(2, Math.min(100, value * 100));
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className="tabular font-medium text-slate-200">
            {pct ? `${Math.round(value * 100)}%` : value.toFixed(2)}
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${w}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
        />
      </div>
    </div>
  );
}

export function Tag({
  children,
  color,
  soft,
}: {
  children: ReactNode;
  color: string;
  soft?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ color, background: soft ?? `${color}1f`, border: `1px solid ${color}33` }}
    >
      {children}
    </span>
  );
}

export function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/40'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan/80">
        {eyebrow}
      </div>
      <h1 className="text-2xl font-bold text-slate-50 md:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>
    </motion.div>
  );
}
