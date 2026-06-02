import type { CausalEdge, Project, RelationshipType } from '../lib/types';

// ============================================================================
// デモ: 自動車産業 × 2035年モビリティ
// ============================================================================

function e(
  source: string, target: string,
  relationshipType: RelationshipType,
  direction: 'positive' | 'negative',
  weight: number, timeLagYears: number, confidence: number,
  evidenceType: string[],
): CausalEdge {
  return {
    id: `${source}->${target}`,
    source, target, relationshipType, direction, weight, timeLagYears, confidence,
    evidenceType, status: confidence >= 0.65 ? 'reviewed' : 'hypothesis',
  };
}

export const mobilityProject: Project = {
  id: 'mobility-2035',
  name: '自動車産業 × 2035年モビリティ',
  tagline: 'AIが遅れたら自動運転は何年遅れるか。半導体が詰まると、どの未来経路が細るか',
  description:
    'AI・自動運転・半導体・電池・規制・社会受容性などを因果ネットワーク化し、2035年モビリティ社会の急所を可視化する。技術だけでは普及しない——規制・保険・社会受容性を同時に設計する必要があることを構造で示す。',
  horizonStart: 2026,
  horizonEnd: 2040,
  factors: [
    { id: 'ai', name: 'AI', category: 'Technology', description: '認識・判断・制御を高度化する基盤技術。', timeStart: 2024, timePeak: 2032, timeEnd: 2045, maturity: 0.72, uncertainty: 0.46, substitutability: 0.22, controllability: 0.38, evidenceScore: 0.81 },
    { id: 'semicon', name: '半導体', category: 'Technology', description: 'AI・自動車・産業機器の物理的基盤。供給制約が全体を律速する。', timeStart: 2024, timePeak: 2030, timeEnd: 2045, maturity: 0.6, uncertainty: 0.55, substitutability: 0.15, controllability: 0.25, evidenceScore: 0.8 },
    { id: 'ad', name: '自動運転', category: 'Technology', description: '自律的に走行する車両技術。AIと半導体に強く依存。', timeStart: 2026, timePeak: 2035, timeEnd: 2045, maturity: 0.45, uncertainty: 0.6, substitutability: 0.2, controllability: 0.4, evidenceScore: 0.7 },
    { id: 'battery', name: '電池', category: 'Technology', description: 'EV・蓄電の中核。コストとエネルギー密度が普及を左右。', timeStart: 2024, timePeak: 2032, timeEnd: 2045, maturity: 0.58, uncertainty: 0.5, substitutability: 0.3, controllability: 0.45, evidenceScore: 0.75 },
    { id: 'reg', name: '規制', category: 'Governance', description: '安全基準・責任分界・実証許可など社会実装速度を律する。', timeStart: 2026, timePeak: 2032, timeEnd: 2040, maturity: 0.35, uncertainty: 0.6, substitutability: 0.1, controllability: 0.7, evidenceScore: 0.68 },
    { id: 'insurance', name: '保険', category: 'Governance', description: '事故時の責任・補償を担保する制度。普及の前提条件。', timeStart: 2028, timePeak: 2033, timeEnd: 2040, maturity: 0.3, uncertainty: 0.55, substitutability: 0.25, controllability: 0.6, evidenceScore: 0.6 },
    { id: 'cyber', name: 'サイバーセキュリティ', category: 'Risk', description: '自動化社会の信頼基盤。攻撃は社会不信に直結。', timeStart: 2026, timePeak: 2032, timeEnd: 2045, maturity: 0.5, uncertainty: 0.5, substitutability: 0.2, controllability: 0.5, evidenceScore: 0.7 },
    { id: 'accept', name: '社会受容性', category: 'Culture', description: '技術普及の最終関門。事故・不信で大きく揺れる。', timeStart: 2026, timePeak: 2034, timeEnd: 2045, maturity: 0.4, uncertainty: 0.65, substitutability: 0.1, controllability: 0.45, evidenceScore: 0.6 },
    { id: 'logistics', name: '物流自動化', category: 'Market', description: '自動運転を社会インフラ化する最有力ユースケース。', timeStart: 2028, timePeak: 2036, timeEnd: 2045, maturity: 0.35, uncertainty: 0.55, substitutability: 0.35, controllability: 0.4, evidenceScore: 0.62 },
    { id: 'labor', name: '物流人材不足', category: 'People', description: '自動化需要を生むドライバー。社会課題が技術を引く。', timeStart: 2026, timePeak: 2032, timeEnd: 2042, maturity: 0.7, uncertainty: 0.35, substitutability: 0.3, controllability: 0.35, evidenceScore: 0.72 },
    { id: 'energy', name: 'エネルギーインフラ', category: 'Market', description: '充電網・電力供給。EV・物流自動化の前提。', timeStart: 2026, timePeak: 2033, timeEnd: 2045, maturity: 0.45, uncertainty: 0.5, substitutability: 0.3, controllability: 0.5, evidenceScore: 0.66 },
    { id: 'city', name: '都市構造変化', category: 'Market', description: 'モビリティ変革がもたらす都市・雇用の構造変化。', timeStart: 2032, timePeak: 2040, timeEnd: 2050, maturity: 0.2, uncertainty: 0.7, substitutability: 0.4, controllability: 0.3, evidenceScore: 0.5 },
  ],
  edges: [
    e('semicon', 'ai', 'dependency', 'positive', 0.82, 1, 0.78, ['market_report', 'paper']),
    e('ai', 'ad', 'enabler', 'positive', 0.86, 4, 0.74, ['paper', 'patent', 'expert_review']),
    e('semicon', 'ad', 'dependency', 'positive', 0.7, 3, 0.72, ['market_report']),
    e('battery', 'ad', 'enabler', 'positive', 0.45, 3, 0.6, ['market_report']),
    e('reg', 'ad', 'enabler', 'positive', 0.8, 2, 0.72, ['expert_review']),
    e('insurance', 'ad', 'dependency', 'positive', 0.6, 2, 0.65, ['expert_review']),
    e('cyber', 'accept', 'inhibitor', 'negative', 0.6, 1, 0.66, ['expert_review']),
    e('accept', 'ad', 'enabler', 'positive', 0.72, 2, 0.68, ['paper']),
    e('ad', 'logistics', 'enabler', 'positive', 0.8, 3, 0.7, ['market_report']),
    e('labor', 'logistics', 'amplifier', 'positive', 0.7, 1, 0.72, ['market_report']),
    e('energy', 'logistics', 'dependency', 'positive', 0.55, 2, 0.62, ['market_report']),
    e('logistics', 'city', 'enabler', 'positive', 0.65, 4, 0.6, ['expert_review']),
    e('ad', 'accept', 'amplifier', 'positive', 0.4, 2, 0.55, ['internal']),
    e('reg', 'insurance', 'enabler', 'positive', 0.6, 1, 0.66, ['expert_review']),
    e('battery', 'energy', 'amplifier', 'positive', 0.5, 2, 0.6, ['market_report']),
  ],
  scenarios: [
    { id: 'mob-base', name: '自動運転物流社会（基本）', targetYear: 2040, futureImage: '自動運転と物流自動化が社会実装された都市', assumptions: ['AIの進展', '規制整備', '半導体供給安定', '社会受容性の向上'], risks: ['サイバー攻撃', '事故責任問題', '技術不信', '地政学リスク'] },
    { id: 'mob-delay', name: '規制・半導体停滞シナリオ', targetYear: 2040, futureImage: '技術は進むが社会実装が遅れ、限定地域に留まる', assumptions: ['規制整備の遅延', '半導体供給制約'], risks: ['投資減少', '事業機会の喪失'] },
  ],
  backcasts: {
    'mob-base': [
      { year: 2040, title: '自動運転物流が社会インフラ化', conditions: ['全国規模の商用自動物流', '都市構造の再編', '雇用制度の適応'] },
      { year: 2035, title: '限定地域で商用自動物流が普及', conditions: ['社会受容性の向上', '物流自動化の事業化', 'エネルギーインフラ整備'] },
      { year: 2032, title: '保険・責任分界・規制整備', conditions: ['保険制度の確立', '責任分界の法整備', 'サイバー安全基準'] },
      { year: 2030, title: '高精度地図・通信・安全基準整備', conditions: ['AI・半導体の確保', '安全基準の策定', '実証地域の拡大'] },
      { year: 2028, title: '実証地域の拡大', conditions: ['限定地域での実証', '社会受容性醸成', '保険の試験運用'] },
      { year: 2026, title: 'AI・半導体・サイバーへの重点投資', conditions: ['AI/半導体投資', '規制・標準化団体への関与', 'サイバーを初期要件に'] },
    ],
  },
  loops: [
    { id: 'mob-vicious', name: '自動運転の悪循環', type: 'balancing', nodes: ['ad', 'accept', 'reg', 'ad'], narrative: '自動運転事故 → 社会不信 → 規制強化 → 実証停滞 → 投資減少 → 技術進化の鈍化。サイバー事故がこのループの引き金になりやすい。' },
    { id: 'mob-demand', name: '人手不足が引く自動化需要', type: 'reinforcing', nodes: ['labor', 'logistics', 'ad', 'logistics'], narrative: '物流人材不足 → 自動化需要 → 物流自動化の投資 → 自動運転の実用化加速 → さらなる自動化。社会課題が技術を引く構造。' },
  ],
};
