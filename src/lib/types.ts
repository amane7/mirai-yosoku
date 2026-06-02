// ============================================================================
// Future Nexus OS — Domain Types
// 未来を「因果ネットワーク」として扱うためのデータモデル
// ============================================================================

export type FactorCategory =
  | 'Technology' // 技術
  | 'Data' // データ基盤
  | 'Organization' // 組織・制度
  | 'Culture' // 文化・心理
  | 'People' // 人材
  | 'Governance' // 規制・ガバナンス
  | 'Market' // 市場
  | 'Risk' // リスク';

export const CATEGORY_META: Record<
  FactorCategory,
  { label: string; color: string; soft: string }
> = {
  Technology: { label: '技術', color: '#22d3ee', soft: 'rgba(34,211,238,0.16)' },
  Data: { label: 'データ基盤', color: '#3b82f6', soft: 'rgba(59,130,246,0.16)' },
  Organization: { label: '組織・制度', color: '#8b5cf6', soft: 'rgba(139,92,246,0.16)' },
  Culture: { label: '文化・心理', color: '#ec4899', soft: 'rgba(236,72,153,0.16)' },
  People: { label: '人材', color: '#10b981', soft: 'rgba(16,185,129,0.16)' },
  Governance: { label: '規制・統治', color: '#f59e0b', soft: 'rgba(245,158,11,0.16)' },
  Market: { label: '市場', color: '#a3e635', soft: 'rgba(163,230,53,0.16)' },
  Risk: { label: 'リスク', color: '#ef4444', soft: 'rgba(239,68,68,0.16)' },
};

/** 因子を構成する数値ディメンション（細分化分析の基本軸） */
export type FactorDimensionKey =
  | 'maturity'
  | 'uncertainty'
  | 'substitutability'
  | 'controllability'
  | 'evidenceScore';

export const DIMENSION_META: Record<
  FactorDimensionKey,
  { label: string; hint: string; /** FCSを押し上げる向き: up=高いほど急所性↑ / down=低いほど急所性↑ */ favorable: 'up' | 'down' }
> = {
  maturity: { label: '成熟度', hint: '技術・施策がどれだけ実用段階にあるか', favorable: 'up' },
  uncertainty: { label: '不確実性', hint: '高いほど未来を大きく揺らす', favorable: 'up' },
  substitutability: { label: '代替可能性', hint: '高いほど他で補え、急所性は下がる', favorable: 'down' },
  controllability: { label: '操作可能性', hint: '自社・行政・個人が動かせる度合い', favorable: 'up' },
  evidenceScore: { label: '証拠の厚さ', hint: '主張を支える根拠の確かさ', favorable: 'up' },
};

/**
 * サブ因子（因子を構成する下位コンポーネント）。
 * 因子の粒度を細分化し、どの構成要素が急所性を生んでいるかを分解分析するための単位。
 * 各サブ因子は独自の指標を持ち、weight に応じて親因子へロールアップされる。
 */
export interface SubFactor {
  id: string;
  name: string;
  description?: string;
  /** 親因子内での寄与重み（相対値、ロールアップ時に正規化） */
  weight: number;
  maturity: number;
  uncertainty: number;
  substitutability: number;
  controllability: number;
  evidenceScore: number;
}

/** ノード：未来因子 */
export interface Factor {
  id: string;
  name: string;
  category: FactorCategory;
  description: string;
  /** 重要化する期間 */
  timeStart: number;
  timePeak: number;
  timeEnd: number;
  /** 成熟度 0-1 */
  maturity: number;
  /** 不確実性 0-1（高いほど未来を揺らす） */
  uncertainty: number;
  /** 代替可能性 0-1（高いほど他で補える） */
  substitutability: number;
  /** 自社・行政・個人が動かせる度合い 0-1 */
  controllability: number;
  /** 根拠の厚さ 0-1 */
  evidenceScore: number;
  evidence?: string[];
  /**
   * サブ因子（細分化）。存在する場合、5指標は weight 加重平均でここからロールアップされる。
   * 粒度を上げて「どの構成要素が効いているか」を分解分析できる。
   */
  subFactors?: SubFactor[];
}

export type RelationshipType =
  | 'enabler' // 促進・可能化
  | 'amplifier' // 増幅
  | 'inhibitor' // 抑制
  | 'dependency'; // 依存・前提

/** エッジ：因果関係 */
export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: RelationshipType;
  /** positive=促進 / negative=抑制 */
  direction: 'positive' | 'negative';
  /** 影響度 0-1 */
  weight: number;
  /** 時間遅延（年） */
  timeLagYears: number;
  /** 信頼度 0-1 */
  confidence: number;
  evidenceType: string[];
  /** AI提案で未レビュー = hypothesis */
  status: 'reviewed' | 'hypothesis';
  comment?: string;
}

/** シナリオ */
export interface Scenario {
  id: string;
  name: string;
  targetYear: number;
  futureImage: string;
  assumptions: string[];
  risks: string[];
}

/** バックキャスティングのマイルストーン */
export interface BackcastMilestone {
  year: number;
  title: string;
  conditions: string[];
}

/** プロジェクト（テーマ） */
export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  horizonStart: number;
  horizonEnd: number;
  factors: Factor[];
  edges: CausalEdge[];
  scenarios: Scenario[];
  backcasts: Record<string, BackcastMilestone[]>; // scenarioId -> milestones
  loops: CausalLoop[];
}

/** 因果ループ */
export interface CausalLoop {
  id: string;
  name: string;
  type: 'reinforcing' | 'balancing';
  nodes: string[]; // factor ids in loop order
  narrative: string;
}

// ----- 分析結果 -----

export interface FactorScores {
  betweenness: number; // 中心媒介性
  directInfluence: number; // 直接影響度
  indirectInfluence: number; // 間接影響度
  bottleneck: number; // ボトルネック度
  knockoutImpact: number; // ノックアウト影響度
  futureCriticality: number; // 独自総合指標 FCS
}

/** FCSを構成する各要素の寄与（積モデルの対数分解） */
export interface FcsContribution {
  key: string;
  label: string;
  /** その要素の0-1値（表示用） */
  value: number;
  /** FCS（対数空間）への寄与シェア 0-1（合計1） */
  share: number;
  color: string;
}

/** 1ディメンションを微小変化させたときのFCS感応度 */
export interface DimensionSensitivity {
  key: FactorDimensionKey;
  label: string;
  current: number;
  /** +0.1したときのFCS変化（正規化前の相対％） */
  deltaUp: number;
  /** -0.1したときのFCS変化 */
  deltaDown: number;
  /** 感応度の大きさ（|deltaUp|+|deltaDown|） */
  magnitude: number;
  favorable: 'up' | 'down';
}

/** ノックアウト操作の状態 */
export interface KnockoutState {
  /** factorId -> 強度倍率 (1=通常, 0=消滅) */
  strength: Record<string, number>;
  /** factorId -> 遅延年数 */
  delay: Record<string, number>;
}
