import type { Project, RelationshipType } from '../lib/types';

// ============================================================================
// プロジェクト: SINIC理論 × 社会発展の急所
// SINIC理論の「科学→技術→社会→ニーズ→科学」という円環的相互作用と、
// 最適化社会から自律社会への大転換を、因果ネットワークとして可視化する。
// これにより、急所ランキング・反実仮想・IFストーリー・バックキャスティング等の
// 既存エンジンを SINIC理論の上で動かせる。
// ============================================================================

function e(
  source: string,
  target: string,
  relationshipType: RelationshipType,
  direction: 'positive' | 'negative',
  weight: number,
  timeLagYears: number,
  confidence: number,
  evidenceType: string[] = ['sinic'],
  status: 'reviewed' | 'hypothesis' = 'reviewed',
) {
  return {
    id: `${source}->${target}`,
    source,
    target,
    relationshipType,
    direction,
    weight,
    timeLagYears,
    confidence,
    evidenceType,
    status,
  };
}

export const sinicSocietyProject: Project = {
  id: 'sinic-society',
  name: 'SINIC理論 × 社会発展',
  tagline: '最適化社会から自律社会へ。大転換を成功させる急所はどこにあるか',
  description:
    'SINIC理論の「科学・技術・社会の円環的相互作用」と「最適化社会→自律社会」への大転換を、因果ネットワークとして構造化。人間の意欲（進歩志向→共生志向）を原動力に、どの因子が欠けると自律社会への到達が遠のくのか——理論を反実仮想シミュレーションで検証できる。',
  horizonStart: 2025,
  horizonEnd: 2035,
  factors: [
    // --- 円環トライアド：科学・技術・社会 ---
    {
      id: 'science', name: 'サイコネティクス（科学）', category: 'Technology',
      description: '心理学とサイバネティクスの融合。自由エネルギー原理など、自律社会を支えるサイエンスの種。',
      timeStart: 2020, timePeak: 2030, timeEnd: 2040,
      maturity: 0.35, uncertainty: 0.6, substitutability: 0.3, controllability: 0.4, evidenceScore: 0.55,
      evidence: ['フリストン 自由エネルギー原理', 'サイコ・サイバネティクス'],
    },
    {
      id: 'tech', name: '精神生体技術（技術）', category: 'Technology',
      description: '生体・精神に関わる制御技術。"制御"を含まない命名に「心はコントロールしない」という意志が宿る。',
      timeStart: 2022, timePeak: 2031, timeEnd: 2040,
      maturity: 0.3, uncertainty: 0.6, substitutability: 0.35, controllability: 0.45, evidenceScore: 0.5,
    },
    {
      id: 'society', name: '自律社会OS（社会）', category: 'Organization',
      description: '境界が曖昧で、各自が自律的に最適を求めた結果が全体最適につながる新しい社会システム。',
      timeStart: 2025, timePeak: 2032, timeEnd: 2040,
      maturity: 0.25, uncertainty: 0.65, substitutability: 0.2, controllability: 0.5, evidenceScore: 0.5,
    },
    // --- 原動力 ---
    {
      id: 'intent', name: '共生志向の意欲（原動力）', category: 'Culture',
      description: '円環の中心で3者を駆動する人間の意欲。進歩志向から共生志向へアップデートされた原動力。',
      timeStart: 2024, timePeak: 2032, timeEnd: 2042,
      maturity: 0.4, uncertainty: 0.55, substitutability: 0.15, controllability: 0.45, evidenceScore: 0.55,
      evidence: ['成熟社会での進歩志向の減衰', '共生・ウェルビーイング志向の高まり'],
    },
    // --- 最適化社会の3局面 ---
    {
      id: 'infoOpt', name: '情報最適化', category: 'Data',
      description: 'スマホ・IoT・AIで人もモノもネットワークにつながり、最適な状態を獲得できる。',
      timeStart: 2005, timePeak: 2020, timeEnd: 2032,
      maturity: 0.75, uncertainty: 0.35, substitutability: 0.3, controllability: 0.5, evidenceScore: 0.85,
      evidence: ['スマホ普及', 'Industry 4.0', 'マス・カスタマイゼーション'],
    },
    {
      id: 'socialOpt', name: '社会課題最適化', category: 'Governance',
      description: '工業社会の忘れもの（気候変動・格差・資源枯渇）を片づける。SDGsの潮流。',
      timeStart: 2015, timePeak: 2028, timeEnd: 2035,
      maturity: 0.45, uncertainty: 0.5, substitutability: 0.25, controllability: 0.6, evidenceScore: 0.7,
      evidence: ['SDGs', 'BEYOND GDP', '成長の限界'],
    },
    {
      id: 'omenOpt', name: '未来予兆の最適化', category: 'Culture',
      description: '働き方・所有から利用へ・分散化など、自律社会への予兆を読み取り先取りする。',
      timeStart: 2018, timePeak: 2030, timeEnd: 2038,
      maturity: 0.4, uncertainty: 0.55, substitutability: 0.35, controllability: 0.55, evidenceScore: 0.6,
      evidence: ['リモートワーク', 'シェアリングエコノミー', '自立と自律の分散化'],
    },
    // --- 多元的指標（指標アップデート） ---
    {
      id: 'wellbeing', name: '多元的ウェルビーイング指標', category: 'Governance',
      description: '単一の経済指標(GNP)から、生活の質・持続可能性を含む多元的な豊かさの尺度へ。',
      timeStart: 2020, timePeak: 2030, timeEnd: 2040,
      maturity: 0.35, uncertainty: 0.55, substitutability: 0.3, controllability: 0.65, evidenceScore: 0.62,
      evidence: ['GNH', 'OECD BLI', '新国富指標(IWI)'],
    },
    // --- 自律社会の3要素 ---
    {
      id: 'independence', name: '自立', category: 'People',
      description: '一人ひとりが自ら判断し、社会からの顕在的管理に依存せず行動できる力。',
      timeStart: 2025, timePeak: 2032, timeEnd: 2040,
      maturity: 0.4, uncertainty: 0.5, substitutability: 0.2, controllability: 0.5, evidenceScore: 0.58,
    },
    {
      id: 'collaboration', name: '連携（つながり）', category: 'Culture',
      description: '行き過ぎた「個」を是正し、集団＝つながりを取り戻す。コンビビアリティ・共感資本。',
      timeStart: 2025, timePeak: 2032, timeEnd: 2040,
      maturity: 0.38, uncertainty: 0.5, substitutability: 0.25, controllability: 0.5, evidenceScore: 0.55,
      evidence: ['ティール組織', '共感資本社会', '孤独問題担当大臣'],
    },
    {
      id: 'creation', name: '創造（セカンド・ルネッサンス）', category: 'Culture',
      description: '価値は「新しいものを創造すること」にのみ存在する。暇を遊び・学び・創作に活かす。',
      timeStart: 2026, timePeak: 2033, timeEnd: 2042,
      maturity: 0.32, uncertainty: 0.55, substitutability: 0.3, controllability: 0.45, evidenceScore: 0.5,
      evidence: ['セカンド・ルネッサンス', '成長社会から成熟社会へ'],
    },
    {
      id: 'mzgen', name: 'M・Z世代の参画', category: 'People',
      description: '未来の傍観者ではない担い手。自律社会は周縁から立ち現れる。適応ではなく「参画」。',
      timeStart: 2024, timePeak: 2030, timeEnd: 2042,
      maturity: 0.45, uncertainty: 0.45, substitutability: 0.2, controllability: 0.4, evidenceScore: 0.55,
    },
    // --- リスク：人間の弱体化 ---
    {
      id: 'weakening', name: '人間の弱体化（リスク）', category: 'Risk',
      description: '困難のない秩序ある社会で、3つの闘争（自然・他者・自分）への抵抗力が失われる恐れ。',
      timeStart: 2025, timePeak: 2032, timeEnd: 2042,
      maturity: 0.3, uncertainty: 0.6, substitutability: 0.3, controllability: 0.45, evidenceScore: 0.5,
      evidence: ['B.ラッセルの3つの闘争', '自律難民・不良老人問題'],
    },
  ],
  edges: [
    // 円環トライアド（Seed → 革新 → ニーズ → 刺激）
    e('science', 'tech', 'enabler', 'positive', 0.8, 2, 0.7, ['sinic']), // 科学が技術の種
    e('tech', 'society', 'enabler', 'positive', 0.82, 2, 0.7, ['sinic']), // 技術が社会を革新
    e('society', 'tech', 'dependency', 'positive', 0.7, 1, 0.68, ['sinic']), // 社会が技術にニーズ
    e('tech', 'science', 'amplifier', 'positive', 0.6, 2, 0.6, ['sinic']), // 社会的価値が科学を刺激
    e('science', 'society', 'enabler', 'positive', 0.5, 3, 0.55, ['sinic'], 'hypothesis'), // 可能性
    e('society', 'science', 'amplifier', 'positive', 0.5, 2, 0.55, ['sinic'], 'hypothesis'), // 夢・倫理
    // 原動力（意欲）が3者を駆動
    e('intent', 'science', 'amplifier', 'positive', 0.7, 1, 0.65, ['sinic']),
    e('intent', 'tech', 'amplifier', 'positive', 0.7, 1, 0.65, ['sinic']),
    e('intent', 'society', 'amplifier', 'positive', 0.75, 1, 0.68, ['sinic']),
    // 最適化社会の3局面 → 自律社会OS
    e('infoOpt', 'society', 'enabler', 'positive', 0.7, 2, 0.72, ['sinic']),
    e('socialOpt', 'society', 'enabler', 'positive', 0.72, 2, 0.7, ['sinic']),
    e('omenOpt', 'society', 'enabler', 'positive', 0.68, 2, 0.66, ['sinic']),
    e('infoOpt', 'omenOpt', 'enabler', 'positive', 0.6, 1, 0.65, ['sinic']),
    e('wellbeing', 'socialOpt', 'enabler', 'positive', 0.62, 2, 0.6, ['sinic']),
    e('wellbeing', 'intent', 'amplifier', 'positive', 0.55, 2, 0.58, ['sinic']),
    // 社会OS → 自律社会の3要素
    e('society', 'independence', 'enabler', 'positive', 0.7, 2, 0.66, ['sinic']),
    e('society', 'collaboration', 'enabler', 'positive', 0.68, 2, 0.64, ['sinic']),
    e('society', 'creation', 'enabler', 'positive', 0.62, 3, 0.6, ['sinic']),
    e('independence', 'collaboration', 'amplifier', 'positive', 0.55, 1, 0.58, ['sinic']),
    e('collaboration', 'creation', 'amplifier', 'positive', 0.58, 2, 0.58, ['sinic']),
    e('mzgen', 'society', 'amplifier', 'positive', 0.62, 2, 0.6, ['sinic']),
    e('mzgen', 'intent', 'amplifier', 'positive', 0.6, 1, 0.6, ['sinic']),
    e('creation', 'intent', 'amplifier', 'positive', 0.5, 2, 0.55, ['sinic']), // 創造が次の意欲を生む
    // リスク：弱体化が自立・創造を抑制
    e('society', 'weakening', 'enabler', 'positive', 0.45, 2, 0.5, ['sinic'], 'hypothesis'),
    e('weakening', 'independence', 'inhibitor', 'negative', 0.55, 1, 0.55, ['sinic']),
    e('weakening', 'creation', 'inhibitor', 'negative', 0.5, 1, 0.52, ['sinic']),
    e('creation', 'weakening', 'inhibitor', 'negative', 0.45, 2, 0.5, ['sinic']), // 創造が弱体化を抑える
  ],
  scenarios: [
    {
      id: 'sinic-autonomous',
      name: '自律社会到達シナリオ',
      targetYear: 2033,
      futureImage: '自立・連携・創造による自律社会のOSが立ち上がり、心⇔物・集団⇔個の対立を超えていく社会',
      assumptions: ['共生志向の意欲の活性', '多元的指標への転換', '最適化3局面の前進', 'M・Z世代の参画'],
      risks: ['人間の弱体化', '新旧社会OSの衝突', '進歩志向の減衰による発展の収束'],
    },
    {
      id: 'sinic-stall',
      name: '最適化の踊り場シナリオ',
      targetYear: 2033,
      futureImage: '情報最適化は進むが社会課題が片づかず、個の孤立と弱体化で自律社会へ移行できない社会',
      assumptions: ['経済単一指標への固執', '社会課題最適化の停滞'],
      risks: ['VUCAの長期化', '自律難民の増加', '次サイクルへの連結失敗'],
    },
  ],
  backcasts: {
    'sinic-autonomous': [
      { year: 2033, title: '自然社会への連結（次サイクル始点）', conditions: ['自立・連携・創造が社会OSとして定着', '心⇔物・集団⇔個の対立の超克', '創造が新たな意欲を再生産'] },
      { year: 2032, title: '自律社会OSの立ち上がり', conditions: ['自立と連携の両立', '人間の弱体化リスクの抑制', '精神生体技術の社会実装'] },
      { year: 2030, title: '最適化3局面の収束', conditions: ['社会課題最適化の前進', '未来予兆の最適化', 'M・Z世代の本格参画'] },
      { year: 2028, title: '指標と原動力の転換', conditions: ['多元的ウェルビーイング指標の導入', '進歩志向→共生志向への転換', 'サイコネティクスの萌芽'] },
      { year: 2026, title: '大転換の自覚', conditions: ['新旧社会OSの衝突の直視', '情報最適化の社会浸透', '科学⇔社会の対話（ELSI）開始'] },
    ],
  },
  loops: [
    {
      id: 'sinic-cycle',
      name: 'SINIC円環（科学→技術→社会→科学）',
      type: 'reinforcing',
      nodes: ['science', 'tech', 'society'],
      narrative:
        '科学が技術の種となり、技術が社会を革新し、社会がニーズと社会的価値で科学を刺激する。中心の人間の意欲が、この円環の回転を加速させる原動力。',
    },
    {
      id: 'sinic-autonomy-loop',
      name: '自立×連携×創造の好循環',
      type: 'reinforcing',
      nodes: ['independence', 'collaboration', 'creation', 'intent'],
      narrative:
        '自立が連携を生み、連携が創造を促し、創造が新たな共生志向の意欲を生む。この好循環が自律社会のOSを自走させる。',
    },
    {
      id: 'sinic-weakening-loop',
      name: '弱体化の悪循環（要警戒）',
      type: 'balancing',
      nodes: ['society', 'weakening', 'independence'],
      narrative:
        '困難のない秩序ある社会は人間の抵抗力を奪い、自立を損なう。創造的な「真の変化」を組み込むことでこの悪循環を断つ必要がある。',
    },
  ],
};
