import type { Project } from '../lib/types';

// ============================================================================
// MVP デモ: 生成AI × 組織変革 の未来マップ
// ============================================================================

export const genaiOrgProject: Project = {
  id: 'genai-org',
  name: '生成AI × 組織変革',
  tagline: '生成AIが「定着する組織」と「止まる組織」を分ける急所はどこか',
  description:
    '生成AIが組織に定着し、DX文化として根づくまでの因果構造を可視化する。技術導入だけでは普及しない——評価制度・心理的安全性・データ基盤・経営コミットメントといった「非技術因子」が、どこで未来経路を細らせるのかを読み解く。',
  horizonStart: 2026,
  horizonEnd: 2034,
  factors: [
    {
      id: 'genai', name: '生成AI', category: 'Technology',
      description: '文章・コード・画像などを生成し、知的業務を支援する基盤技術。',
      timeStart: 2024, timePeak: 2030, timeEnd: 2040,
      maturity: 0.7, uncertainty: 0.4, substitutability: 0.25, controllability: 0.45, evidenceScore: 0.85,
      evidence: ['LLMベンチマークの継続的向上', '社内PoC事例', '主要ベンダーロードマップ'],
      // 「生成AI」を構成要素レベルに細分化（分解分析のデモ）
      subFactors: [
        {
          id: 'genai-llm', name: '基盤モデル（LLM）', weight: 1.4,
          description: '汎用的な言語・推論能力を担うコアモデル。進化は速いが自社では作れない。',
          maturity: 0.8, uncertainty: 0.45, substitutability: 0.2, controllability: 0.2, evidenceScore: 0.9,
        },
        {
          id: 'genai-rag', name: '検索拡張（RAG）', weight: 1.0,
          description: '社内知識をモデルに接続し、業務に効く回答へ落とし込む層。',
          maturity: 0.55, uncertainty: 0.45, substitutability: 0.4, controllability: 0.7, evidenceScore: 0.7,
        },
        {
          id: 'genai-agent', name: 'エージェント実行', weight: 0.9,
          description: 'ツール連携で自律的にタスクを遂行する応用層。最も不確実だが伸びしろ大。',
          maturity: 0.35, uncertainty: 0.7, substitutability: 0.3, controllability: 0.55, evidenceScore: 0.5,
        },
        {
          id: 'genai-multimodal', name: 'マルチモーダル', weight: 0.7,
          description: '画像・音声・動画を横断する生成能力。業務適用はこれから。',
          maturity: 0.5, uncertainty: 0.5, substitutability: 0.45, controllability: 0.4, evidenceScore: 0.62,
        },
      ],
    },
    {
      id: 'data', name: 'データ基盤', category: 'Data',
      description: '業務データを整備・接続し、AIが活用できる状態にする基盤。',
      timeStart: 2025, timePeak: 2030, timeEnd: 2038,
      maturity: 0.45, uncertainty: 0.4, substitutability: 0.3, controllability: 0.7, evidenceScore: 0.72,
      evidence: ['データ整備が活用度を左右する社内調査', 'RAG精度とデータ品質の相関'],
      subFactors: [
        {
          id: 'data-quality', name: 'データ品質・整備', weight: 1.3,
          description: '欠損・表記ゆれ・鮮度。AI活用度を最も左右する地味だが急所の要素。',
          maturity: 0.4, uncertainty: 0.35, substitutability: 0.2, controllability: 0.8, evidenceScore: 0.78,
        },
        {
          id: 'data-pipeline', name: '連携パイプライン', weight: 1.0,
          description: '各業務システムからデータを集約・更新し続ける配管。',
          maturity: 0.5, uncertainty: 0.4, substitutability: 0.35, controllability: 0.75, evidenceScore: 0.65,
        },
        {
          id: 'data-governance', name: 'データガバナンス', weight: 0.8,
          description: '権限・分類・監査。整備しないと活用が止まる前提条件。',
          maturity: 0.45, uncertainty: 0.45, substitutability: 0.3, controllability: 0.7, evidenceScore: 0.6,
        },
      ],
    },
    {
      id: 'standardize', name: '業務標準化', category: 'Organization',
      description: '属人的な業務を可視化・標準化し、AI適用しやすくする。',
      timeStart: 2026, timePeak: 2031, timeEnd: 2036,
      maturity: 0.4, uncertainty: 0.45, substitutability: 0.4, controllability: 0.75, evidenceScore: 0.6,
    },
    {
      id: 'psafety', name: '心理的安全性', category: 'Culture',
      description: '失敗や試行を許容し、安心して挑戦できる組織風土。',
      timeStart: 2026, timePeak: 2032, timeEnd: 2040,
      maturity: 0.42, uncertainty: 0.5, substitutability: 0.2, controllability: 0.55, evidenceScore: 0.68,
      evidence: ['Google Project Aristotle', '挑戦行動と風土の相関研究'],
    },
    {
      id: 'evaluation', name: '評価制度', category: 'Organization',
      description: 'AI活用や挑戦を正当に評価し、報いる仕組み。',
      timeStart: 2027, timePeak: 2032, timeEnd: 2040,
      maturity: 0.3, uncertainty: 0.55, substitutability: 0.25, controllability: 0.8, evidenceScore: 0.62,
    },
    {
      id: 'middle', name: '中間管理職', category: 'People',
      description: '現場と経営をつなぎ、変革を翻訳・推進する層。',
      timeStart: 2026, timePeak: 2031, timeEnd: 2038,
      maturity: 0.5, uncertainty: 0.45, substitutability: 0.35, controllability: 0.6, evidenceScore: 0.58,
    },
    {
      id: 'citizen', name: '市民開発', category: 'People',
      description: '非IT人材が自ら業務アプリ・自動化を作る動き。',
      timeStart: 2027, timePeak: 2033, timeEnd: 2040,
      maturity: 0.35, uncertainty: 0.5, substitutability: 0.4, controllability: 0.55, evidenceScore: 0.55,
    },
    {
      id: 'knowledge', name: 'ナレッジ共有', category: 'Culture',
      description: '成功・失敗事例やプロンプトを組織で共有する文化。',
      timeStart: 2026, timePeak: 2031, timeEnd: 2040,
      maturity: 0.4, uncertainty: 0.45, substitutability: 0.45, controllability: 0.65, evidenceScore: 0.6,
    },
    {
      id: 'reskilling', name: 'リスキリング', category: 'People',
      description: 'AI時代に必要なスキルを継続的に学び直す取り組み。',
      timeStart: 2026, timePeak: 2032, timeEnd: 2040,
      maturity: 0.38, uncertainty: 0.45, substitutability: 0.4, controllability: 0.7, evidenceScore: 0.6,
    },
    {
      id: 'security', name: 'セキュリティ', category: 'Risk',
      description: '情報漏洩・コンプライアンスなどAI活用の信頼基盤。',
      timeStart: 2025, timePeak: 2030, timeEnd: 2040,
      maturity: 0.55, uncertainty: 0.4, substitutability: 0.3, controllability: 0.65, evidenceScore: 0.7,
    },
    {
      id: 'commitment', name: '経営コミットメント', category: 'Governance',
      description: '経営層が変革を本気で推進し、資源を配分する意思。',
      timeStart: 2026, timePeak: 2030, timeEnd: 2038,
      maturity: 0.48, uncertainty: 0.5, substitutability: 0.15, controllability: 0.85, evidenceScore: 0.66,
    },
    {
      id: 'success', name: '現場の成功体験', category: 'Culture',
      description: '実際に業務が改善された実感。普及の起点となる燃料。',
      timeStart: 2026, timePeak: 2030, timeEnd: 2038,
      maturity: 0.4, uncertainty: 0.45, substitutability: 0.3, controllability: 0.55, evidenceScore: 0.6,
    },
  ],
  edges: [
    e('commitment', 'data', 'enabler', 'positive', 0.78, 1, 0.78, ['expert_review']),
    e('commitment', 'evaluation', 'enabler', 'positive', 0.82, 2, 0.8, ['expert_review']),
    e('commitment', 'security', 'enabler', 'positive', 0.6, 1, 0.7, ['internal']),
    e('commitment', 'psafety', 'enabler', 'positive', 0.55, 2, 0.6, ['expert_review']),
    e('genai', 'success', 'enabler', 'positive', 0.8, 1, 0.75, ['paper', 'internal']),
    e('data', 'genai', 'dependency', 'positive', 0.85, 1, 0.82, ['paper', 'internal']),
    e('data', 'success', 'enabler', 'positive', 0.6, 2, 0.7, ['internal']),
    e('security', 'genai', 'dependency', 'positive', 0.5, 1, 0.65, ['internal']),
    e('success', 'knowledge', 'enabler', 'positive', 0.72, 1, 0.7, ['internal']),
    e('psafety', 'success', 'enabler', 'positive', 0.7, 1, 0.72, ['paper']),
    e('psafety', 'knowledge', 'amplifier', 'positive', 0.66, 1, 0.68, ['paper']),
    e('knowledge', 'citizen', 'enabler', 'positive', 0.68, 2, 0.66, ['internal']),
    e('knowledge', 'reskilling', 'amplifier', 'positive', 0.6, 2, 0.62, ['internal']),
    e('evaluation', 'knowledge', 'amplifier', 'positive', 0.7, 2, 0.68, ['expert_review']),
    e('evaluation', 'psafety', 'amplifier', 'positive', 0.58, 2, 0.6, ['expert_review']),
    e('middle', 'standardize', 'enabler', 'positive', 0.62, 2, 0.6, ['internal']),
    e('middle', 'psafety', 'amplifier', 'positive', 0.6, 2, 0.62, ['expert_review']),
    e('standardize', 'citizen', 'enabler', 'positive', 0.64, 2, 0.6, ['internal']),
    e('standardize', 'genai', 'enabler', 'positive', 0.55, 2, 0.58, ['internal']),
    e('reskilling', 'citizen', 'enabler', 'positive', 0.66, 3, 0.62, ['internal']),
    e('citizen', 'success', 'amplifier', 'positive', 0.6, 2, 0.6, ['internal']),
    e('success', 'commitment', 'amplifier', 'positive', 0.5, 2, 0.55, ['internal']),
  ],
  scenarios: [
    {
      id: 'genai-base',
      name: 'DX文化定着シナリオ（基本）',
      targetYear: 2034,
      futureImage: '生成AIが日常業務に溶け込み、市民開発とナレッジ共有が自走する組織',
      assumptions: ['経営コミットメントの継続', '評価制度の改定', 'データ基盤の整備', '心理的安全性の向上'],
      risks: ['セキュリティ事故', '有志疲れ', '部門サイロ', '評価制度の停滞'],
    },
    {
      id: 'genai-stall',
      name: 'チャット止まりシナリオ',
      targetYear: 2034,
      futureImage: '生成AIが一部の有志のチャット利用に留まり、業務プロセスに接続されない組織',
      assumptions: ['データ基盤の未整備', '評価制度の据え置き'],
      risks: ['投資の停滞', '人材流出', '競合に後れ'],
    },
  ],
  backcasts: {
    'genai-base': [
      { year: 2034, title: 'DX文化が自走する組織', conditions: ['市民開発が部門横断で常態化', 'ナレッジ共有が制度化', 'AI活用が評価に直結'] },
      { year: 2032, title: 'AI活用が標準業務に', conditions: ['評価制度の改定完了', '心理的安全性の組織的向上', 'リスキリング制度の本格運用'] },
      { year: 2030, title: '成功体験の横展開', conditions: ['データ基盤の主要業務接続', 'ナレッジ共有プラットフォーム稼働', '中間管理職の変革推進力強化'] },
      { year: 2028, title: '基盤と制度の整備', conditions: ['業務標準化の着手', 'セキュリティ要件の組込み', 'パイロット部門の拡大'] },
      { year: 2026, title: '重点投資の意思決定', conditions: ['経営コミットメントの明文化', 'データ基盤への投資', 'PoCと評価制度設計の開始'] },
    ],
  },
  loops: [
    {
      id: 'loop-virtuous',
      name: '生成AI活用の好循環',
      type: 'reinforcing',
      nodes: ['genai', 'success', 'knowledge', 'citizen', 'success'],
      narrative:
        '生成AI活用 → 業務改善の成功体験 → ナレッジ共有 → 市民開発の広がり → さらなる成功体験。心理的安全性と評価制度がこのループの増幅率を決める。',
    },
    {
      id: 'loop-fatigue',
      name: '有志疲れの悪循環',
      type: 'balancing',
      nodes: ['success', 'knowledge', 'evaluation', 'psafety', 'success'],
      narrative:
        '成功しても評価されない → ナレッジ共有が義務化・形骸化 → 心理的安全性が低下 → 試す人が減り成功体験が枯れる。評価制度が崩れると好循環を打ち消す。',
    },
  ],
};

function e(
  source: string, target: string,
  relationshipType: import('../lib/types').RelationshipType,
  direction: 'positive' | 'negative',
  weight: number, timeLagYears: number, confidence: number,
  evidenceType: string[],
): import('../lib/types').CausalEdge {
  return {
    id: `${source}->${target}`,
    source, target, relationshipType, direction, weight, timeLagYears, confidence,
    evidenceType,
    status: confidence >= 0.65 ? 'reviewed' : 'hypothesis',
  };
}
