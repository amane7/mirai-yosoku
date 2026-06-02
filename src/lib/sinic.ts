// ============================================================================
// SINIC 理論 — ドメインモデル & データ
// 出典: 『ＳＩＮＩＣ理論 過去半世紀を言い当て、来たる半世紀を予測するオムロンの未来学』
// (日本能率協会マネジメントセンター) を徹底研究のうえ構造化。
//
// SINIC = Seed-Innovation and Need-Impetus Cyclic Evolution of technological innovation
// 「科学が技術の種となり、技術は社会を革新する。そして社会は技術に新たなニーズを与え、
//  技術はその社会的価値によってさらなる科学の発展に刺激を与える。
//  そのような円環的な技術革新の進化」
// ============================================================================

/** 心⇔物 軸（-1=心中心 / +1=物中心） と 集団⇔個 軸（-1=集団中心 / +1=個中心） */
export interface ValueCoord {
  heartMatter: number; // -1 (心) .. +1 (物)
  groupIndiv: number; // -1 (集団) .. +1 (個)
}

export type StageKind = 'past' | 'present' | 'future' | 'beyond';

/** SINIC 10段階（+自然社会）の社会発展区分 */
export interface SinicStage {
  id: string;
  /** 表示順（0=原始） */
  order: number;
  name: string; // 例: 情報化社会
  englishName?: string; // 例: Cybernation Society
  /** 年代ラベル */
  era: string;
  /** 数値の開始年（タイムライン描画用。先史は負値で概念表現） */
  yearStart: number;
  yearEnd: number;
  /** 推計 一人当たりGNP (米ドル) — 社会発展指標。範囲の上限値を代表値に */
  gnpLabel: string;
  gnpValue: number; // 対数スケール描画用の代表値
  /** 価値観座標（円錐スパイラル上の位置） */
  coord: ValueCoord;
  /** 円環トライアド：この段階を駆動した 科学(種) / 技術 / 社会(革新) */
  science: string;
  technology: string;
  society: string;
  /** ひとことサマリー */
  summary: string;
  /** 詳細解説（研究に基づく要約） */
  detail: string;
  /** 時代の転換点・象徴的な出来事 */
  highlights: string[];
  kind: StageKind;
  /** テーマカラー */
  color: string;
}

// ----------------------------------------------------------------------------
// 10段階データ（原始 → 自律 ＋ 次サイクル始点としての自然社会）
// ----------------------------------------------------------------------------

export const SINIC_STAGES: SinicStage[] = [
  {
    id: 'primitive',
    order: 0,
    name: '原始社会',
    era: '紀元前100万年〜',
    yearStart: -1000000,
    yearEnd: -10000,
    gnpLabel: '〜100 ドル',
    gnpValue: 80,
    coord: { heartMatter: -0.95, groupIndiv: -0.7 },
    science: '初生科学（天文・数学・冶金・解剖）',
    technology: '道具以前 → 石器',
    society: '遊動する狩猟採集の小集団',
    summary: '道具も所有観念もない、「心」の世界から人類史が始まる。',
    detail:
      'アフリカのサバンナへ歩み出した少人数の移動集団。生命・食料の確保のため自ずと集団をつくり、言葉・壁画など「心を通わせる」ことの価値を重視した。やがて石器をつくり、クラン（氏族）で定住を始める——「社会化」の始まり。',
    highlights: ['四大文明の発生', '言葉・アート', 'クラン（氏族）社会'],
    kind: 'past',
    color: '#84cc16',
  },
  {
    id: 'agriculture',
    order: 1,
    name: '農業社会（集住）',
    era: '〜13世紀（中世）',
    yearStart: -10000,
    yearEnd: 1300,
    gnpLabel: '100〜170 ドル',
    gnpValue: 170,
    coord: { heartMatter: -0.7, groupIndiv: -0.9 },
    science: '農学・暦学の発達',
    technology: '農耕・牧畜・青銅器/鉄器',
    society: '都市の誕生・商取引・宗教の力',
    summary: '農耕と都市化で「物」の価値が芽生え、心と集団がピークへ。',
    detail:
      '農耕とその収穫物の価値が高まり「物」を重視する価値観が芽生える。都市が生まれ、宗教が力を拡大。安心・安定を求める「心と集団」中心の価値観が、この変わり目でピークを迎えた。',
    highlights: ['都市国家ローマ', '宗教の力の拡大', '鉄器の取引'],
    kind: 'past',
    color: '#65a30d',
  },
  {
    id: 'handicraft',
    order: 2,
    name: '手工業社会',
    era: '14〜16世紀（ルネッサンス）',
    yearStart: 1300,
    yearEnd: 1600,
    gnpLabel: '約300 ドル',
    gnpValue: 300,
    coord: { heartMatter: -0.3, groupIndiv: -0.4 },
    science: '近代科学の勃興（ガリレオ/コペルニクス）',
    technology: '羅針盤・火薬・印刷（三大発明）',
    society: 'ルネッサンス：人間性の解放・個の尊重',
    summary: 'ペスト→ルネッサンスという大混乱を経て、新パラダイムへシフト。',
    detail:
      '14世紀のペスト大流行（人口の1/3が死亡）で教会の一元的権力が失墜。古典復興・人間性の解放・個性の尊重を掲げるルネッサンスへ。近代科学の基礎が築かれ、心だけでなく物・個の価値も重視され始める。',
    highlights: ['ペスト大流行', 'ダ・ヴィンチ', '大航海時代・資本主義の端緒'],
    kind: 'past',
    color: '#f59e0b',
  },
  {
    id: 'industrial',
    order: 3,
    name: '工業化社会',
    era: '18世紀後半〜',
    yearStart: 1760,
    yearEnd: 1860,
    gnpLabel: '300〜700 ドル',
    gnpValue: 700,
    coord: { heartMatter: 0.4, groupIndiv: 0.2 },
    science: '力学・熱力学（近代自然科学）',
    technology: '蒸気機関・水力紡績機（Industry 1.0）',
    society: '産業革命・フランス革命・哲学革命',
    summary: '産業革命で「物」中心の価値観が急拡大。第1回万博(1851)。',
    detail:
      'ワットの蒸気機関(1765)で大量生産・大量高速輸送が可能に。産業革命・フランス革命（共和制）・ドイツ哲学革命が重なり、「個人」中心の価値観も重視される。1851年ロンドン万博で「物」中心の価値観が極大化。',
    highlights: ['蒸気機関', '第1回万国博覧会', '近代資本主義'],
    kind: 'past',
    color: '#f97316',
  },
  {
    id: 'mechanization',
    order: 4,
    name: '機械化社会',
    era: '19世紀後半〜',
    yearStart: 1860,
    yearEnd: 1945,
    gnpLabel: '700〜2,500 ドル',
    gnpValue: 2500,
    coord: { heartMatter: 0.8, groupIndiv: 0.6 },
    science: '電磁気学・化学（第2次産業革命）',
    technology: '電力・内燃機関・ライン生産（Industry 2.0）',
    society: 'フォード生産方式・科学的管理法',
    summary: '電気と大量生産で「物」と「個人」中心の価値観が極まる。',
    detail:
      'エジソンの電球、ベルの電話、ベンツの自動車。2度の世界大戦が機械製品技術を発展させた。フォードのライン生産とテイラーの科学的管理法で大量・高品質生産が実現。分業の徹底が「個人」中心の見方を強化。',
    highlights: ['電力・電話・自動車', 'フォード生産方式', '科学的管理法'],
    kind: 'past',
    color: '#ef4444',
  },
  {
    id: 'automation',
    order: 5,
    name: '自動化社会',
    era: '〜1974年',
    yearStart: 1945,
    yearEnd: 1974,
    gnpLabel: '2,500〜5,000 ドル',
    gnpValue: 5000,
    coord: { heartMatter: 0.95, groupIndiv: 0.85 },
    science: '制御科学',
    technology: '自動制御技術・NC工作機械・FB制御',
    society: 'オートメーション時代（FA/OA）',
    summary: 'コンピュータ制御で工業社会が絶頂へ。物中心のピーク。',
    detail:
      '「制御科学」が種となり「自動制御技術」が芽生え、製造業にオートメーションをもたらした。製品システムの巨大化・システム産業の出現で自動化が必須に。工業社会は絶頂期を迎え、物中心の価値観がピークを越える。SINIC理論はまさにこの時代(1970)に構想された。',
    highlights: ['オートメーション', 'NC工作機械', 'EXPO70 / SINIC理論発表(1970)'],
    kind: 'past',
    color: '#dc2626',
  },
  {
    id: 'information',
    order: 6,
    name: '情報化社会',
    englishName: 'Cybernation Society',
    era: '1974〜2004年',
    yearStart: 1974,
    yearEnd: 2004,
    gnpLabel: '5,000〜15,000 ドル',
    gnpValue: 15000,
    coord: { heartMatter: 0.6, groupIndiv: 0.95 },
    science: 'サイバネティクス',
    technology: '電子制御技術・コンピュータ・インターネット',
    society: 'システムとして社会をとらえる／情報処理の自動化',
    summary: '「物」から離れ始める揺り戻し。Information ではなく Cybernation。',
    detail:
      'サイバネティクスが種となり電子制御技術が完成。身体動作だけでなく情報処理・判断も自動化。あえて Information Society ではなく "Cybernation Society" と名づけ、通信ネットワークによる革新（後のインターネット）まで見通していた。「物」中心の価値観からの揺り戻しが始まる。',
    highlights: ['IBM-360 / LSI', 'PC・インターネット', 'FA→OAへの拡大'],
    kind: 'past',
    color: '#3b82f6',
  },
  {
    id: 'optimization',
    order: 7,
    name: '最適化社会',
    era: '2005〜2024年',
    yearStart: 2005,
    yearEnd: 2024,
    gnpLabel: '15,000〜40,000 ドル',
    gnpValue: 40000,
    coord: { heartMatter: 0.2, groupIndiv: 0.5 },
    science: 'バイオネティクス（生体×サイバネティクス）',
    technology: '生体制御技術・IoT・AI・センシング',
    society: '新旧社会OSの衝突する非連続な大転換',
    summary: '【現在地】スマホ・SNS・IoT・AIで「最適化」が進む大転換の渦中。',
    detail:
      'スマホ(iPhone 2007)とSNSが情報化社会と最適化社会を分けた。人もモノもすべてがネットワークにつながり「情報最適化」が進む。一方で工業社会の負の遺産（気候変動・格差）を片づける「社会課題最適化」、自律社会へ向かう「未来予兆の最適化」が同時進行。新旧OSがぶつかり混乱するが、これは最適化の渦中の避けられない痛み。価値観は物→心へ、個のピークを越えて再び「集団＝つながり」を求め始める。',
    highlights: ['スマホ・SNS・IoT', 'DX・Industry 4.0', 'SDGs・社会課題最適化', 'リーマンショック/EU/アラブの春'],
    kind: 'present',
    color: '#22d3ee',
  },
  {
    id: 'autonomous',
    order: 8,
    name: '自律社会',
    era: '2025〜2032年',
    yearStart: 2025,
    yearEnd: 2032,
    gnpLabel: '40,000 ドル以上',
    gnpValue: 50000,
    coord: { heartMatter: -0.3, groupIndiv: -0.2 },
    science: 'サイコネティクス（心理×サイバネティクス）',
    technology: '精神生体技術（"制御"を含まない命名に意味）',
    society: '自立・連携・創造／コンビビアリティ',
    summary: '意識的な管理から、管理のない社会への移行期。自立×連携×創造。',
    detail:
      '「自立」と「連携」と「創造」による社会。各メンバーが社会からの顕在的管理にも、自分自身にも困難を強いられることなく自律的に行動できる。ノン・コントロールの理想状態（自然社会）へ向かう過渡期。価値観は「心」へ向かいつつ、行き過ぎた「個」を是正し「集団（つながり）」側へ。担い手はM・Z世代であり、自律社会は周縁から立ち現れる。',
    highlights: ['自立×連携×創造', 'ティール組織', '共感資本社会', 'セカンド・ルネッサンス'],
    kind: 'future',
    color: '#a78bfa',
  },
  {
    id: 'natural',
    order: 9,
    name: '自然社会',
    era: '2033年以降',
    yearStart: 2033,
    yearEnd: 2080,
    gnpLabel: '指標を超える',
    gnpValue: 60000,
    coord: { heartMatter: -0.85, groupIndiv: -0.85 },
    science: 'メタ・サイコネティクス（超心理学）',
    technology: '超技術革新（テレパシー的コミュニケーション）',
    society: 'ハイパー原始社会／自然（じねん）の社会',
    summary: '次サイクルの始点。心⇔物・集団⇔個の対立を超えた一元論の社会。',
    detail:
      'SINIC理論の予測範囲の外、次の発展サイクルの始まり。原始社会へ循環的に戻るように見えて、まったく異なる進化を遂げた「ハイパー原始社会」。精神と物質、時間と空間という二元論の間の一元論的関係において活力が湧き、生きる歓びが追求される。シンギュラリティでもホモ・デウスでもない、東洋思想的な「自然（じねん）」の社会ビジョン。',
    highlights: ['ハイパー原始社会', '自然（じねん）', '次サイクルへ連結'],
    kind: 'beyond',
    color: '#10b981',
  },
];

// ----------------------------------------------------------------------------
// 「現在地」：本書執筆時点では最適化社会の終盤。アプリの現在日(2026)では自律社会の入口。
// ----------------------------------------------------------------------------
export const SINIC_NOW_YEAR = 2026;

export function stageAtYear(year: number): SinicStage {
  // 未来側を優先して判定
  const hit = SINIC_STAGES.find((s) => year >= s.yearStart && year <= s.yearEnd);
  if (hit) return hit;
  return SINIC_STAGES[SINIC_STAGES.length - 1];
}

// ----------------------------------------------------------------------------
// 円環トライアド（科学・技術・社会の円環的相互作用）
// オリジナル ＋ 半世紀後のアップデート の2モード
// ----------------------------------------------------------------------------

export interface TriadNode {
  id: 'science' | 'technology' | 'society' | 'intent';
  label: string;
  sub: string;
  color: string;
}

export interface TriadEdge {
  from: TriadNode['id'];
  to: TriadNode['id'];
  label: string;
  /** オリジナルでは点線（未顕在）だった関係 */
  dashedInOriginal?: boolean;
  /** 中心の意欲からの作用 */
  fromIntent?: boolean;
}

export const TRIAD_NODES: TriadNode[] = [
  { id: 'science', label: '科学', sub: 'Science（種＝Seed）', color: '#22d3ee' },
  { id: 'technology', label: '技術', sub: 'Technology', color: '#a78bfa' },
  { id: 'society', label: '社会', sub: 'Society', color: '#f59e0b' },
  { id: 'intent', label: '人間の意欲', sub: '原動力（中心）', color: '#ec4899' },
];

/** 円環の外周（科学→技術→社会→科学）と、意欲からの3作用 */
export const TRIAD_EDGES: TriadEdge[] = [
  { from: 'science', to: 'technology', label: '種（Seed）：科学が技術の種に' },
  { from: 'technology', to: 'society', label: '革新：技術が社会を革新' },
  { from: 'society', to: 'technology', label: 'ニーズ（Need-Impetus）' },
  { from: 'technology', to: 'science', label: '社会的価値が科学を刺激' },
  // アップデートで実線化された 科学⇔社会
  { from: 'science', to: 'society', label: '可能性（科学→社会）', dashedInOriginal: true },
  { from: 'society', to: 'science', label: '夢・倫理（社会→科学）', dashedInOriginal: true },
  // 中心の意欲からの3作用
  { from: 'intent', to: 'science', label: '探究', fromIntent: true },
  { from: 'intent', to: 'technology', label: '研究・開発', fromIntent: true },
  { from: 'intent', to: 'society', label: 'アップデート: 適応→参画', fromIntent: true },
];

// ----------------------------------------------------------------------------
// 3つの理論的特徴 ＋ アップデート
// ----------------------------------------------------------------------------

export interface TheoryPillar {
  id: string;
  num: number;
  title: string;
  original: string;
  update: string;
}

export const THEORY_PILLARS: TheoryPillar[] = [
  {
    id: 'sts',
    num: 1,
    title: '科学・技術・社会の円環的相互作用',
    original:
      '科学が技術の種となり、技術が社会を革新、社会が技術にニーズを与え、技術が科学を刺激する円環。中心の「人間の進歩志向意欲」が原動力。',
    update:
      '科学⇔社会の関係を点線→実線へ（可能性・夢・倫理／ELSI）。原動力を「進歩志向」から「共生志向」へ、社会への「適応」から「参画」へ。',
  },
  {
    id: 'index',
    num: 2,
    title: '社会発展指標と発展プロセス',
    original:
      '一人当たりGNP（社会的経済力）という単一指標で測定。成熟曲線（ロジスティック曲線）で2033年を漸近点に設定。フォーキャストとバックキャストを架橋。',
    update:
      '単一の経済指標から、ウェルビーイング・持続可能性を含む多元的指標へ（GNH／BLI／新国富指標）。「一人ひとりの豊かさの社会総和」という考え方へ。',
  },
  {
    id: 'value',
    num: 3,
    title: '社会進化と価値観',
    original:
      '「心」中心⇔「物」中心の二元論の往還。円錐形を螺旋状に登り、進化が加速。心=集団／物=個（東洋／西洋のステレオタイプ）。',
    update:
      '心⇔物 と 集団⇔個 の独立した2軸による座標平面へ。「物と集団（シェアリング）」「心と個」も成立。価値観の強弱・バランスまで表現可能に。',
  },
];
