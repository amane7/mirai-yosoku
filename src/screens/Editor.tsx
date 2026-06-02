import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil,
  Plus,
  Trash2,
  Save,
  X,
  RotateCcw,
  Boxes,
  Link2,
  Sparkles,
  AlertTriangle,
  Layers3,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  CATEGORY_META,
  type Factor,
  type FactorCategory,
  type CausalEdge,
  type RelationshipType,
} from '../lib/types';
import { PageHeader, Panel, Pill, Tag, ScoreBar } from '../components/ui';

type Tab = 'factors' | 'edges';

const CATEGORIES = Object.keys(CATEGORY_META) as FactorCategory[];
const REL_TYPES: { v: RelationshipType; label: string }[] = [
  { v: 'enabler', label: '促進・可能化' },
  { v: 'amplifier', label: '増幅' },
  { v: 'inhibitor', label: '抑制' },
  { v: 'dependency', label: '依存・前提' },
];

export function Editor() {
  const { project, scoreResult, dirty, resetProjectToSource } = useStore();
  const [tab, setTab] = useState<Tab>('factors');

  return (
    <div>
      <PageHeader
        eyebrow="Network Editor"
        title="因果ネットワーク・エディタ"
        description="因子（ノード）と因果関係（エッジ）を直接追加・編集・削除できます。変更は即座に急所スコア（FCS）へ反映され、右側のライブランキングがリアルタイムに更新されます。さらに細かく掘り下げたい因子は ▣ アイコンから「分解分析」へ——サブ因子への細分化・FCSの因数分解・感応度分析ができます。"
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-ink-700/60 p-1 ring-1 ring-white/5">
          <TabBtn active={tab === 'factors'} onClick={() => setTab('factors')} icon={<Boxes size={15} />}>
            因子 <span className="ml-1 text-[10px] opacity-70">{project.factors.length}</span>
          </TabBtn>
          <TabBtn active={tab === 'edges'} onClick={() => setTab('edges')} icon={<Link2 size={15} />}>
            因果関係 <span className="ml-1 text-[10px] opacity-70">{project.edges.length}</span>
          </TabBtn>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle size={13} /> 編集中（元データから変更あり）
            </span>
          )}
          <button
            onClick={resetProjectToSource}
            disabled={!dirty}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-400/40 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={13} /> 元に戻す
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div>{tab === 'factors' ? <FactorEditor /> : <EdgeEditor />}</div>
        <LiveRanking />
      </div>
    </div>
  );

  // ---- ライブランキング ----
  function LiveRanking() {
    const top = scoreResult.ranking.slice(0, 8);
    return (
      <div className="space-y-4">
        <Panel title="ライブ急所ランキング" icon={<Sparkles size={16} />} subtitle="編集に応じて即時再計算">
          <div className="space-y-3 px-4 py-4">
            {top.map((r, i) => {
              const meta = CATEGORY_META[r.factor.category];
              return (
                <div key={r.factor.id} className="flex items-center gap-3">
                  <span className="w-5 text-right font-mono text-xs text-slate-500">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-slate-200">{r.factor.name}</span>
                      <span className="font-mono text-xs text-accent-cyan">
                        {Math.round(r.scores.futureCriticality * 100)}
                      </span>
                    </div>
                    <ScoreBar value={r.scores.futureCriticality} color={meta.color} />
                  </div>
                </div>
              );
            })}
            {top.length === 0 && <p className="text-xs text-slate-500">因子がありません。</p>}
          </div>
        </Panel>
      </div>
    );
  }
}

// ============================ 因子エディタ ============================
function FactorEditor() {
  const { project, scoreResult, addFactor, updateFactor, deleteFactor, selectFactor, selectedFactorId } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const blank: Omit<Factor, 'id'> = {
    name: '新しい因子',
    category: 'Technology',
    description: '',
    timeStart: project.horizonStart,
    timePeak: Math.round((project.horizonStart + project.horizonEnd) / 2),
    timeEnd: project.horizonEnd,
    maturity: 0.4,
    uncertainty: 0.5,
    substitutability: 0.4,
    controllability: 0.5,
    evidenceScore: 0.5,
  };

  return (
    <div className="space-y-3">
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent-cyan/30 bg-accent-cyan/5 py-3 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/10"
        >
          <Plus size={16} /> 因子を追加
        </button>
      )}
      {creating && (
        <FactorForm
          initial={blank}
          onCancel={() => setCreating(false)}
          onSave={(f) => {
            addFactor(f);
            setCreating(false);
          }}
        />
      )}

      {project.factors.map((f) => {
        const meta = CATEGORY_META[f.category];
        const fcs = scoreResult.scores[f.id]?.futureCriticality ?? 0;
        if (editingId === f.id) {
          return (
            <FactorForm
              key={f.id}
              initial={f}
              onCancel={() => setEditingId(null)}
              onSave={(patch) => {
                updateFactor(f.id, patch);
                setEditingId(null);
              }}
              onDelete={() => {
                deleteFactor(f.id);
                setEditingId(null);
              }}
            />
          );
        }
        return (
          <div
            key={f.id}
            className={`glass rounded-xl px-4 py-3 transition ${
              selectedFactorId === f.id ? 'ring-1 ring-accent-cyan/40' : ''
            }`}
            onClick={() => selectFactor(selectedFactorId === f.id ? null : f.id)}
          >
            <div className="flex items-center gap-3">
              <Tag color={meta.color} soft={meta.soft}>{meta.label}</Tag>
              <span className="text-sm font-semibold text-slate-100">{f.name}</span>
              <span className="font-mono text-[11px] text-slate-500">{f.timeStart}–{f.timeEnd}</span>
              {(f.subFactors?.length ?? 0) > 0 && (
                <Link
                  to="/decompose"
                  onClick={(e) => { e.stopPropagation(); selectFactor(f.id); }}
                  className="flex items-center gap-1 rounded-full bg-accent-violet/10 px-2 py-0.5 text-[10px] font-medium text-accent-violet ring-1 ring-accent-violet/30 transition hover:bg-accent-violet/20"
                >
                  <Layers3 size={11} /> {f.subFactors!.length} サブ因子
                </Link>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="font-mono text-xs text-accent-cyan">FCS {Math.round(fcs * 100)}</span>
                <Link
                  to="/decompose"
                  onClick={(e) => { e.stopPropagation(); selectFactor(f.id); }}
                  title="この因子を分解分析"
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-accent-violet"
                >
                  <Layers3 size={14} />
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(f.id); }}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-accent-cyan"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`「${f.name}」を削除しますか？関連する因果関係も削除されます。`)) deleteFactor(f.id); }}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {f.description && <p className="mt-1.5 line-clamp-1 text-xs text-slate-500">{f.description}</p>}
          </div>
        );
      })}
    </div>
  );
}

function FactorForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Omit<Factor, 'id'> | Factor;
  onSave: (f: Omit<Factor, 'id'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [d, setD] = useState<Omit<Factor, 'id'>>({ ...initial });
  const set = <K extends keyof Factor>(k: K, v: Factor[K]) => setD((s) => ({ ...s, [k]: v }));

  return (
    <div className="glass rounded-xl border border-accent-cyan/30 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="因子名" className="sm:col-span-2">
          <input
            value={d.name}
            onChange={(e) => set('name', e.target.value)}
            className="inp"
          />
        </Field>
        <Field label="カテゴリ">
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => set('category', c)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  d.category === c ? 'ring-1' : 'opacity-50 hover:opacity-100'
                }`}
                style={{
                  color: CATEGORY_META[c].color,
                  background: CATEGORY_META[c].soft,
                  ...(d.category === c ? ({ boxShadow: `0 0 0 1px ${CATEGORY_META[c].color}` } as any) : {}),
                }}
              >
                {CATEGORY_META[c].label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="説明">
          <input value={d.description} onChange={(e) => set('description', e.target.value)} className="inp" />
        </Field>

        <div className="grid grid-cols-3 gap-2 sm:col-span-2">
          <NumField label="開始年" value={d.timeStart} onChange={(v) => set('timeStart', v)} step={1} />
          <NumField label="ピーク年" value={d.timePeak} onChange={(v) => set('timePeak', v)} step={1} />
          <NumField label="終了年" value={d.timeEnd} onChange={(v) => set('timeEnd', v)} step={1} />
        </div>

        <SliderField label="成熟度" value={d.maturity} onChange={(v) => set('maturity', v)} />
        <SliderField label="不確実性" value={d.uncertainty} onChange={(v) => set('uncertainty', v)} />
        <SliderField label="代替可能性" value={d.substitutability} onChange={(v) => set('substitutability', v)} />
        <SliderField label="操作可能性" value={d.controllability} onChange={(v) => set('controllability', v)} />
        <SliderField label="証拠の厚さ" value={d.evidenceScore} onChange={(v) => set('evidenceScore', v)} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onSave(d)}
          className="flex items-center gap-1.5 rounded-lg bg-accent-cyan/15 px-3.5 py-2 text-xs font-semibold text-accent-cyan ring-1 ring-accent-cyan/40 transition hover:bg-accent-cyan/25"
        >
          <Save size={14} /> 保存
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5"
        >
          <X size={14} /> キャンセル
        </button>
        {onDelete && (
          <button
            onClick={() => { if (confirm('この因子を削除しますか？')) onDelete(); }}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10"
          >
            <Trash2 size={14} /> 削除
          </button>
        )}
      </div>
    </div>
  );
}

// ============================ エッジエディタ ============================
function EdgeEditor() {
  const { project, addEdge, updateEdge, deleteEdge } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const nameOf = (id: string) => project.factors.find((f) => f.id === id)?.name ?? id;

  const blank: Omit<CausalEdge, 'id'> = {
    source: project.factors[0]?.id ?? '',
    target: project.factors[1]?.id ?? '',
    relationshipType: 'enabler',
    direction: 'positive',
    weight: 0.6,
    timeLagYears: 1,
    confidence: 0.6,
    evidenceType: ['internal'],
    status: 'hypothesis',
  };

  return (
    <div className="space-y-3">
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent-cyan/30 bg-accent-cyan/5 py-3 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/10"
        >
          <Plus size={16} /> 因果関係を追加
        </button>
      )}
      {creating && (
        <EdgeForm
          initial={blank}
          onCancel={() => setCreating(false)}
          onSave={(e) => { addEdge(e); setCreating(false); }}
        />
      )}

      {project.edges.map((e) => {
        if (editingId === e.id) {
          return (
            <EdgeForm
              key={e.id}
              initial={e}
              onCancel={() => setEditingId(null)}
              onSave={(patch) => { updateEdge(e.id, patch); setEditingId(null); }}
              onDelete={() => { deleteEdge(e.id); setEditingId(null); }}
            />
          );
        }
        const dirColor = e.direction === 'negative' ? '#ef4444' : '#38bdf8';
        return (
          <div key={e.id} className="glass rounded-xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-100">{nameOf(e.source)}</span>
              <span className="font-mono text-lg leading-none" style={{ color: dirColor }}>
                {e.direction === 'negative' ? '⊣' : '→'}
              </span>
              <span className="text-sm font-medium text-slate-100">{nameOf(e.target)}</span>
              <span className="ml-1 text-[11px] text-slate-500">
                {REL_TYPES.find((r) => r.v === e.relationshipType)?.label}
              </span>
              {e.status === 'hypothesis' && (
                <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-amber-400/30">
                  仮説
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-400">
                  影響{e.weight.toFixed(2)} / 信頼{e.confidence.toFixed(2)} / 遅延{e.timeLagYears}y
                </span>
                <button
                  onClick={() => setEditingId(e.id)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-accent-cyan"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (confirm('この因果関係を削除しますか？')) deleteEdge(e.id); }}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EdgeForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Omit<CausalEdge, 'id'> | CausalEdge;
  onSave: (e: Omit<CausalEdge, 'id'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const { project } = useStore();
  const [d, setD] = useState<Omit<CausalEdge, 'id'>>({ ...initial });
  const set = <K extends keyof CausalEdge>(k: K, v: CausalEdge[K]) => setD((s) => ({ ...s, [k]: v }));
  const factors = project.factors;
  const valid = d.source && d.target && d.source !== d.target;

  return (
    <div className="glass rounded-xl border border-accent-cyan/30 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="原因（source）">
          <select value={d.source} onChange={(e) => set('source', e.target.value)} className="inp">
            {factors.map((f) => <option key={f.id} value={f.id} className="bg-ink-700">{f.name}</option>)}
          </select>
        </Field>
        <Field label="結果（target）">
          <select value={d.target} onChange={(e) => set('target', e.target.value)} className="inp">
            {factors.map((f) => <option key={f.id} value={f.id} className="bg-ink-700">{f.name}</option>)}
          </select>
        </Field>
        <Field label="関係タイプ">
          <div className="flex flex-wrap gap-1">
            {REL_TYPES.map((r) => (
              <Pill key={r.v} active={d.relationshipType === r.v} onClick={() => set('relationshipType', r.v)}>
                {r.label}
              </Pill>
            ))}
          </div>
        </Field>
        <Field label="方向">
          <div className="flex gap-1">
            <Pill active={d.direction === 'positive'} onClick={() => set('direction', 'positive')}>促進 →</Pill>
            <Pill active={d.direction === 'negative'} onClick={() => set('direction', 'negative')}>抑制 ⊣</Pill>
          </div>
        </Field>
        <SliderField label="影響度" value={d.weight} onChange={(v) => set('weight', v)} />
        <SliderField label="信頼度" value={d.confidence} onChange={(v) => set('confidence', v)} />
        <NumField label="時間遅延（年）" value={d.timeLagYears} onChange={(v) => set('timeLagYears', v)} step={1} />
      </div>
      {!valid && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-400">
          <AlertTriangle size={13} /> 原因と結果は別の因子を選んでください。
        </p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => valid && onSave(d)}
          disabled={!valid}
          className="flex items-center gap-1.5 rounded-lg bg-accent-cyan/15 px-3.5 py-2 text-xs font-semibold text-accent-cyan ring-1 ring-accent-cyan/40 transition hover:bg-accent-cyan/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save size={14} /> 保存
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5"
        >
          <X size={14} /> キャンセル
        </button>
        {onDelete && (
          <button
            onClick={() => { if (confirm('この因果関係を削除しますか？')) onDelete(); }}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-rose-400/20 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10"
          >
            <Trash2 size={14} /> 削除
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- 小物 ----------------
function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
        active ? 'bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/30' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function NumField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="inp"
      />
    </Field>
  );
}

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={`${label}：${value.toFixed(2)}`}>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </Field>
  );
}
