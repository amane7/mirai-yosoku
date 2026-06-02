import { useState } from 'react';
import { Sparkles, Plus, X, Check, Pencil, GitCompareArrows } from 'lucide-react';
import { useStore } from '../store/useStore';

/**
 * IFストーリー切替バー（全画面共通）。
 * 「現実」と保存済みのIFストーリーをワンタップで切り替え、全画面が連動する。
 */
export function StoryBar() {
  const {
    stories,
    activeStoryId,
    setActiveStory,
    saveCurrentAsStory,
    deleteStory,
    renameStory,
    project,
    knockout,
    hasIntervention,
  } = useStore();

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const active = stories.find((s) => s.id === activeStoryId) ?? stories[0];
  // 「現実」がアクティブだが介入が加えられている → 未保存の作業中
  const unsavedWorking = active.builtin && hasIntervention();

  const removedNames = (k: typeof knockout) =>
    project.factors
      .filter((f) => (k.strength[f.id] ?? 1) < 1)
      .map((f) => f.name);

  const doSave = () => {
    const n = name.trim() || `IF: ${removedNames(knockout).slice(0, 2).join('・') || '介入'}`;
    saveCurrentAsStory(n);
    setName('');
    setSaving(false);
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-ink-800/50 px-3 py-2.5 backdrop-blur-xl">
      <span className="flex shrink-0 items-center gap-1.5 pl-1 pr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        <GitCompareArrows size={14} className="text-accent-cyan" />
        IFストーリー
      </span>

      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {stories.map((s) => {
          const isActive = s.id === activeStoryId;
          const removed = removedNames(s.knockout);
          if (editingId === s.id) {
            return (
              <div key={s.id} className="flex items-center gap-1 rounded-full bg-ink-700 px-2 py-1 ring-1 ring-accent-cyan/40">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { renameStory(s.id, editName.trim() || s.name); setEditingId(null); }
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-28 bg-transparent text-xs text-slate-100 outline-none"
                />
                <button onClick={() => { renameStory(s.id, editName.trim() || s.name); setEditingId(null); }} className="text-accent-cyan">
                  <Check size={13} />
                </button>
              </div>
            );
          }
          return (
            <button
              key={s.id}
              onClick={() => setActiveStory(s.id)}
              className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                isActive ? 'ring-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                color: isActive ? s.color : '#cbd5e1',
                background: isActive ? `${s.color}1f` : 'rgba(255,255,255,0.03)',
                boxShadow: isActive ? `inset 0 0 0 1px ${s.color}66` : undefined,
              }}
              title={removed.length ? `取り除く: ${removed.join('・')}` : '介入なし'}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.name}
              {s.builtin ? null : (
                <>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditName(s.name); }}
                    className="ml-0.5 hidden text-slate-400 hover:text-accent-cyan group-hover:inline"
                  >
                    <Pencil size={11} />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); if (confirm(`IFストーリー「${s.name}」を削除しますか？`)) deleteStory(s.id); }}
                    className="hidden text-slate-400 hover:text-rose-400 group-hover:inline"
                  >
                    <X size={12} />
                  </span>
                </>
              )}
            </button>
          );
        })}

        {/* 保存フォーム or 保存ボタン */}
        {saving ? (
          <div className="flex items-center gap-1 rounded-full bg-ink-700 px-2 py-1 ring-1 ring-accent-cyan/40">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doSave(); if (e.key === 'Escape') setSaving(false); }}
              placeholder="IFストーリー名…"
              className="w-36 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
            />
            <button onClick={doSave} className="text-accent-cyan"><Check size={14} /></button>
            <button onClick={() => setSaving(false)} className="text-slate-400 hover:text-slate-200"><X size={13} /></button>
          </div>
        ) : (
          unsavedWorking && (
            <button
              onClick={() => setSaving(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-accent-cyan/40 bg-accent-cyan/5 px-3 py-1.5 text-xs font-medium text-accent-cyan transition hover:bg-accent-cyan/10"
            >
              <Plus size={13} /> このIFを保存
            </button>
          )
        )}
      </div>

      {unsavedWorking && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium text-amber-400">
          <Sparkles size={11} /> 未保存の介入
        </span>
      )}
    </div>
  );
}
