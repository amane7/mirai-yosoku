import { create } from 'zustand';
import { PROJECTS, getProject } from '../data';
import {
  computeScores,
  knockoutDiff,
  estimateDelays,
  type ScoreResult,
  type KnockoutDiff,
} from '../lib/analysis';
import type {
  CausalEdge,
  Factor,
  KnockoutState,
  Project,
  SubFactor,
} from '../lib/types';

/** IFストーリー（保存されたシナリオ）。全画面で共有する横断概念。 */
export interface IfStory {
  id: string;
  name: string;
  /** UIアクセント色 */
  color: string;
  /** このIFが表す介入。空＝現実（介入なし） */
  knockout: KnockoutState;
  /** 組込みの「現実」ストーリー（削除・編集不可） */
  builtin?: boolean;
}

const STORY_COLORS = ['#22d3ee', '#a78bfa', '#f59e0b', '#ec4899', '#10b981', '#f43f5e', '#3b82f6'];

interface AppState {
  projectId: string;
  /** 編集可能なワーキングコピー（元の PROJECTS データは不変に保つ） */
  project: Project;
  targetYear: number;
  scoreResult: ScoreResult;
  selectedFactorId: string | null;
  knockout: KnockoutState;
  /** 元データから編集されているか */
  dirty: boolean;

  // ---- IFストーリー（横断シナリオ） ----
  stories: IfStory[];
  activeStoryId: string;

  setProject: (id: string) => void;
  setTargetYear: (year: number) => void;
  selectFactor: (id: string | null) => void;

  setStrength: (id: string, value: number) => void;
  setDelay: (id: string, years: number) => void;
  resetKnockout: () => void;

  // ---- IFストーリー操作 ----
  setActiveStory: (id: string) => void;
  saveCurrentAsStory: (name: string) => string;
  deleteStory: (id: string) => void;
  renameStory: (id: string, name: string) => void;
  getActiveStory: () => IfStory;
  hasIntervention: () => boolean;

  // ---- エディタ (B): 因子・因果関係 CRUD（ライブ再計算付き） ----
  addFactor: (f: Omit<Factor, 'id'> & { id?: string }) => string;
  updateFactor: (id: string, patch: Partial<Factor>) => void;
  deleteFactor: (id: string) => void;
  addEdge: (e: Omit<CausalEdge, 'id'> & { id?: string }) => string;
  updateEdge: (id: string, patch: Partial<CausalEdge>) => void;
  deleteEdge: (id: string) => void;
  resetProjectToSource: () => void;

  // ---- サブ因子（細分化）CRUD ----
  addSubFactor: (factorId: string, sub?: Partial<SubFactor>) => string;
  updateSubFactor: (factorId: string, subId: string, patch: Partial<SubFactor>) => void;
  deleteSubFactor: (factorId: string, subId: string) => void;

  // derived
  getKnockoutDiff: () => ReturnType<typeof knockoutDiff>;
  getDelays: () => Record<string, number>;
}

const emptyKnockout = (): KnockoutState => ({ strength: {}, delay: {} });

/** 元データを汚さないためのディープクローン */
function cloneProject(p: Project): Project {
  return {
    ...p,
    factors: p.factors.map((f) => ({
      ...f,
      evidence: f.evidence ? [...f.evidence] : undefined,
      subFactors: f.subFactors ? f.subFactors.map((s) => ({ ...s })) : undefined,
    })),
    edges: p.edges.map((e) => ({ ...e, evidenceType: [...e.evidenceType] })),
    scenarios: p.scenarios.map((s) => ({ ...s, assumptions: [...s.assumptions], risks: [...s.risks] })),
    backcasts: Object.fromEntries(
      Object.entries(p.backcasts).map(([k, v]) => [k, v.map((m) => ({ ...m, conditions: [...m.conditions] }))]),
    ),
    loops: p.loops.map((l) => ({ ...l, nodes: [...l.nodes] })),
  };
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const cloneKnockout = (k: KnockoutState): KnockoutState => ({
  strength: { ...k.strength },
  delay: { ...k.delay },
});

const BASELINE_STORY = (): IfStory => ({
  id: 'baseline',
  name: '現実（介入なし）',
  color: '#94a3b8',
  knockout: emptyKnockout(),
  builtin: true,
});

const knockoutActive = (k: KnockoutState) =>
  Object.values(k.strength).some((v) => v < 1) || Object.values(k.delay).some((v) => v > 0);

/** ライブのknockout編集を、アクティブな（組込みでない）ストーリーへ反映する */
function syncToActiveStory(
  s: { stories: IfStory[]; activeStoryId: string },
  knockout: KnockoutState,
): Partial<{ stories: IfStory[] }> {
  const active = s.stories.find((x) => x.id === s.activeStoryId);
  if (!active || active.builtin) return {};
  return {
    stories: s.stories.map((x) =>
      x.id === active.id ? { ...x, knockout: cloneKnockout(knockout) } : x,
    ),
  };
}

const initialSource = PROJECTS[0];
const initialProject = cloneProject(initialSource);
const initialYear = initialProject.scenarios[0]?.targetYear ?? initialProject.horizonEnd;

export const useStore = create<AppState>((set, get) => ({
  projectId: initialProject.id,
  project: initialProject,
  targetYear: initialYear,
  scoreResult: computeScores(initialProject, initialYear),
  selectedFactorId: null,
  knockout: emptyKnockout(),
  dirty: false,
  stories: [BASELINE_STORY()],
  activeStoryId: 'baseline',

  setProject: (id) => {
    const source = getProject(id) ?? PROJECTS[0];
    const project = cloneProject(source);
    const year = project.scenarios[0]?.targetYear ?? project.horizonEnd;
    set({
      projectId: project.id,
      project,
      targetYear: year,
      scoreResult: computeScores(project, year),
      selectedFactorId: null,
      knockout: emptyKnockout(),
      dirty: false,
      stories: [BASELINE_STORY()],
      activeStoryId: 'baseline',
    });
  },

  setTargetYear: (year) => {
    const { project } = get();
    set({ targetYear: year, scoreResult: computeScores(project, year) });
  },

  selectFactor: (id) => set({ selectedFactorId: id }),

  setStrength: (id, value) =>
    set((s) => {
      const knockout = { ...s.knockout, strength: { ...s.knockout.strength, [id]: value } };
      return { knockout, ...syncToActiveStory(s, knockout) };
    }),

  setDelay: (id, years) =>
    set((s) => {
      const knockout = { ...s.knockout, delay: { ...s.knockout.delay, [id]: years } };
      return { knockout, ...syncToActiveStory(s, knockout) };
    }),

  resetKnockout: () =>
    set((s) => {
      const knockout = emptyKnockout();
      // リセットすると「現実」ストーリーに戻る
      return { knockout, activeStoryId: 'baseline' };
    }),

  // ---------------- IFストーリー ----------------
  setActiveStory: (id) =>
    set((s) => {
      const story = s.stories.find((x) => x.id === id) ?? s.stories[0];
      return { activeStoryId: story.id, knockout: cloneKnockout(story.knockout) };
    }),

  saveCurrentAsStory: (name) => {
    const id = uid('if');
    set((s) => {
      const color = STORY_COLORS[(s.stories.length - 1) % STORY_COLORS.length];
      const story: IfStory = { id, name: name.trim() || `IF #${s.stories.length}`, color, knockout: cloneKnockout(s.knockout) };
      return { stories: [...s.stories, story], activeStoryId: id };
    });
    return id;
  },

  deleteStory: (id) =>
    set((s) => {
      if (id === 'baseline') return {};
      const stories = s.stories.filter((x) => x.id !== id);
      const wasActive = s.activeStoryId === id;
      return {
        stories,
        ...(wasActive ? { activeStoryId: 'baseline', knockout: emptyKnockout() } : {}),
      };
    }),

  renameStory: (id, name) =>
    set((s) => ({
      stories: s.stories.map((x) => (x.id === id && !x.builtin ? { ...x, name } : x)),
    })),

  getActiveStory: () => {
    const { stories, activeStoryId } = get();
    return stories.find((x) => x.id === activeStoryId) ?? stories[0];
  },

  hasIntervention: () => knockoutActive(get().knockout),

  // ---------------- エディタ CRUD ----------------
  addFactor: (f) => {
    const id = f.id ?? uid('f');
    set((s) => {
      const factor: Factor = { ...(f as Factor), id };
      const project: Project = { ...s.project, factors: [...s.project.factors, factor] };
      return { project, dirty: true, scoreResult: computeScores(project, s.targetYear) };
    });
    return id;
  },

  updateFactor: (id, patch) =>
    set((s) => {
      const factors = s.project.factors.map((f) => (f.id === id ? { ...f, ...patch } : f));
      const project: Project = { ...s.project, factors };
      return { project, dirty: true, scoreResult: computeScores(project, s.targetYear) };
    }),

  deleteFactor: (id) =>
    set((s) => {
      const factors = s.project.factors.filter((f) => f.id !== id);
      const edges = s.project.edges.filter((e) => e.source !== id && e.target !== id);
      const loops = s.project.loops.filter((l) => !l.nodes.includes(id));
      const project: Project = { ...s.project, factors, edges, loops };
      return {
        project,
        dirty: true,
        selectedFactorId: s.selectedFactorId === id ? null : s.selectedFactorId,
        scoreResult: computeScores(project, s.targetYear),
      };
    }),

  addEdge: (e) => {
    const id = e.id ?? uid('e');
    set((s) => {
      // 同一 source->target の重複は更新扱い
      const dup = s.project.edges.find((x) => x.source === e.source && x.target === e.target);
      const edge: CausalEdge = { ...(e as CausalEdge), id: dup ? dup.id : id };
      const edges = dup
        ? s.project.edges.map((x) => (x.id === dup.id ? edge : x))
        : [...s.project.edges, edge];
      const project: Project = { ...s.project, edges };
      return { project, dirty: true, scoreResult: computeScores(project, s.targetYear) };
    });
    return id;
  },

  updateEdge: (id, patch) =>
    set((s) => {
      const edges = s.project.edges.map((e) =>
        e.id === id
          ? {
              ...e,
              ...patch,
              status:
                (patch.confidence ?? e.confidence) >= 0.65 ? 'reviewed' : (e.status ?? 'hypothesis'),
            }
          : e,
      );
      const project: Project = { ...s.project, edges };
      return { project, dirty: true, scoreResult: computeScores(project, s.targetYear) };
    }),

  deleteEdge: (id) =>
    set((s) => {
      const edges = s.project.edges.filter((e) => e.id !== id);
      const project: Project = { ...s.project, edges };
      return { project, dirty: true, scoreResult: computeScores(project, s.targetYear) };
    }),

  // ---------------- サブ因子（細分化）CRUD ----------------
  addSubFactor: (factorId, sub) => {
    const id = sub?.id ?? uid('sf');
    set((s) => {
      const factors = s.project.factors.map((f) => {
        if (f.id !== factorId) return f;
        // 初回追加時は親の指標を初期値として引き継ぐ
        const seed: SubFactor = {
          id,
          name: sub?.name ?? '新しいサブ因子',
          description: sub?.description ?? '',
          weight: sub?.weight ?? 1,
          maturity: sub?.maturity ?? f.maturity,
          uncertainty: sub?.uncertainty ?? f.uncertainty,
          substitutability: sub?.substitutability ?? f.substitutability,
          controllability: sub?.controllability ?? f.controllability,
          evidenceScore: sub?.evidenceScore ?? f.evidenceScore,
        };
        return { ...f, subFactors: [...(f.subFactors ?? []), seed] };
      });
      const project: Project = { ...s.project, factors };
      return { project, dirty: true, scoreResult: computeScores(project, s.targetYear) };
    });
    return id;
  },

  updateSubFactor: (factorId, subId, patch) =>
    set((s) => {
      const factors = s.project.factors.map((f) => {
        if (f.id !== factorId || !f.subFactors) return f;
        return {
          ...f,
          subFactors: f.subFactors.map((sf) => (sf.id === subId ? { ...sf, ...patch } : sf)),
        };
      });
      const project: Project = { ...s.project, factors };
      return { project, dirty: true, scoreResult: computeScores(project, s.targetYear) };
    }),

  deleteSubFactor: (factorId, subId) =>
    set((s) => {
      const factors = s.project.factors.map((f) => {
        if (f.id !== factorId || !f.subFactors) return f;
        const remaining = f.subFactors.filter((sf) => sf.id !== subId);
        return { ...f, subFactors: remaining.length ? remaining : undefined };
      });
      const project: Project = { ...s.project, factors };
      return { project, dirty: true, scoreResult: computeScores(project, s.targetYear) };
    }),

  resetProjectToSource: () =>
    set((s) => {
      const source = getProject(s.projectId) ?? PROJECTS[0];
      const project = cloneProject(source);
      return {
        project,
        dirty: false,
        knockout: emptyKnockout(),
        scoreResult: computeScores(project, s.targetYear),
      };
    }),

  getKnockoutDiff: () => {
    const { project, knockout } = get();
    return knockoutDiff(project, knockout);
  },

  getDelays: () => {
    const { project, knockout } = get();
    return estimateDelays(project, knockout);
  },
}));

export { PROJECTS };
export type { KnockoutDiff };
