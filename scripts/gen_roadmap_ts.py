#!/usr/bin/env python3
"""Generate src/data/roadmap-data.ts and src/data/roadmap.ts from /tmp/roadmap/roadmap.json."""
import json

J = json.load(open("/tmp/roadmap/roadmap.json", encoding="utf-8"))
ERAS = J["eras"]
PEST = J["pest"]

AXIS_META = {
    "technology": {"label": "テクノロジー", "category": "Technology", "color": "#22d3ee"},
    "market": {"label": "マーケット", "category": "Market", "color": "#a3e635"},
    "literacy": {"label": "リテラシー", "category": "People", "color": "#10b981"},
    "culture": {"label": "カルチャー", "category": "Culture", "color": "#ec4899"},
}
AXIS_ORDER = ["technology", "market", "literacy", "culture"]


def js(s):
    """Escape a python string for a TS single-quoted string literal."""
    if s is None:
        s = ""
    s = str(s)
    s = s.replace("\\", "\\\\").replace("'", "\\'")
    s = s.replace("\n", " ").replace("\r", " ").strip()
    # collapse multiple spaces
    while "  " in s:
        s = s.replace("  ", " ")
    return s


def era_years(era):
    a, b = era.split("-")
    a, b = int(a), int(b)
    return a, (a + b) // 2, b


# ---------------------------------------------------------------------------
# 1) roadmap-data.ts  (full browsable dataset)
# ---------------------------------------------------------------------------
def gen_data_ts():
    out = []
    out.append("// AUTO-GENERATED from Future Road Map_ver1.00.xlsx — do not edit by hand.")
    out.append("// 4軸(テクノロジー/マーケット/リテラシー/カルチャー) × 7時代 のキーワード要素分解 + Tech Effect + PEST")
    out.append("")
    out.append("export type RoadmapAxisKey = 'technology' | 'market' | 'literacy' | 'culture';")
    out.append("")
    out.append("export interface RoadmapIndustry { industry: string; level: string; }")
    out.append("")
    out.append("export interface RoadmapKeyword {")
    out.append("  no: number;")
    out.append("  name: string;")
    out.append("  summary: string;")
    out.append("  /** technology軸のみ: Tech Effect のポジティブ/ネガティブ市場影響と業界インパクト */")
    out.append("  posMarket?: string;")
    out.append("  negMarket?: string;")
    out.append("  posIndustries?: RoadmapIndustry[];")
    out.append("  negIndustries?: RoadmapIndustry[];")
    out.append("}")
    out.append("")
    out.append("export interface RoadmapEra {")
    out.append("  era: string;")
    out.append("  startYear: number;")
    out.append("  midYear: number;")
    out.append("  endYear: number;")
    out.append("  axes: Record<RoadmapAxisKey, RoadmapKeyword[]>;")
    out.append("}")
    out.append("")
    out.append("export interface RoadmapPestItem { keyword: string; desc: string; }")
    out.append("export interface RoadmapPestYear {")
    out.append("  year: string;")
    out.append("  politics: RoadmapPestItem[];")
    out.append("  economy: RoadmapPestItem[];")
    out.append("  society: RoadmapPestItem[];")
    out.append("  technology: RoadmapPestItem[];")
    out.append("}")
    out.append("")
    out.append("export const ROADMAP_AXIS_META: Record<RoadmapAxisKey, { label: string; category: string; color: string }> = {")
    for ax in AXIS_ORDER:
        m = AXIS_META[ax]
        out.append(f"  {ax}: {{ label: '{m['label']}', category: '{m['category']}', color: '{m['color']}' }},")
    out.append("};")
    out.append("")

    # eras
    out.append("export const ROADMAP_ERAS: RoadmapEra[] = [")
    for blk in ERAS:
        sy, my, ey = era_years(blk["era"])
        out.append("  {")
        out.append(f"    era: '{blk['era']}', startYear: {sy}, midYear: {my}, endYear: {ey},")
        out.append("    axes: {")
        for ax in AXIS_ORDER:
            out.append(f"      {ax}: [")
            for it in blk["axes"][ax]:
                parts = [f"no: {it['no']}", f"name: '{js(it['name'])}'", f"summary: '{js(it['summary'])}'"]
                if ax == "technology":
                    if it.get("posMarket"):
                        parts.append(f"posMarket: '{js(it['posMarket'])}'")
                    if it.get("negMarket"):
                        parts.append(f"negMarket: '{js(it['negMarket'])}'")
                    if it.get("posIndustries"):
                        inds = ", ".join(f"{{ industry: '{js(x['industry'])}', level: '{js(x['level'])}' }}" for x in it["posIndustries"])
                        parts.append(f"posIndustries: [{inds}]")
                    if it.get("negIndustries"):
                        inds = ", ".join(f"{{ industry: '{js(x['industry'])}', level: '{js(x['level'])}' }}" for x in it["negIndustries"])
                        parts.append(f"negIndustries: [{inds}]")
                out.append("        { " + ", ".join(parts) + " },")
            out.append("      ],")
        out.append("    },")
        out.append("  },")
    out.append("];")
    out.append("")

    # PEST
    out.append("export const ROADMAP_PEST: RoadmapPestYear[] = [")
    for p in PEST:
        out.append("  {")
        out.append(f"    year: '{js(p['year'])}',")
        for k in ["politics", "economy", "society", "technology"]:
            items = ", ".join(f"{{ keyword: '{js(i['keyword'])}', desc: '{js(i['desc'])}' }}" for i in p[k])
            out.append(f"    {k}: [{items}],")
        out.append("  },")
    out.append("];")
    out.append("")

    with open("/home/user/webapp/src/data/roadmap-data.ts", "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print("Wrote roadmap-data.ts")


# ---------------------------------------------------------------------------
# 2) roadmap.ts  (runnable Project — era×axis -> Factor, keyword -> SubFactor)
# ---------------------------------------------------------------------------
# Heuristic metric scoring per era (later eras = more speculative => higher
# uncertainty, lower maturity, lower evidence). Axis tweaks the controllability.
ERA_METRICS = {
    # era: (maturity, uncertainty, evidence)
    "2020-2024": (0.80, 0.30, 0.85),
    "2025-2029": (0.62, 0.45, 0.72),
    "2030-2034": (0.45, 0.58, 0.58),
    "2035-2039": (0.32, 0.68, 0.46),
    "2040-2044": (0.22, 0.78, 0.36),
    "2045-2049": (0.14, 0.86, 0.27),
    "2050-2054": (0.08, 0.92, 0.18),
}
# axis -> (substitutability, controllability) baseline
AXIS_METRICS = {
    "technology": (0.30, 0.40),
    "market": (0.45, 0.50),
    "literacy": (0.35, 0.70),
    "culture": (0.40, 0.45),
}

# how many representative keywords per (era,axis) become sub-factors of the Factor
SUBS_PER_CELL = 8


def clamp(x):
    return max(0.02, min(0.98, round(x, 2)))


def gen_project_ts():
    out = []
    out.append("import type { Project, Factor, SubFactor, FactorCategory } from '../lib/types';")
    out.append("")
    out.append("// ============================================================================")
    out.append("// Future Road Map — 4軸 × 7時代の要素分解プロジェクト")
    out.append("// 各「時代 × 軸」を1つの因子とし、その中のキーワード群をサブ因子(要素分解)として保持する。")
    out.append("// 元データ: Future Road Map_ver1.00.xlsx（1,400キーワード）を分析用に代表抽出。")
    out.append("// AUTO-GENERATED by scripts/gen_roadmap_ts.py")
    out.append("// ============================================================================")
    out.append("")

    factors = []
    factor_ids = []
    edges = []

    for blk in ERAS:
        era = blk["era"]
        sy, my, ey = era_years(era)
        em = ERA_METRICS[era]
        for ax in AXIS_ORDER:
            m = AXIS_META[ax]
            am = AXIS_METRICS[ax]
            fid = f"{ax[:3]}-{era[:4]}"
            factor_ids.append((fid, ax, era, my))
            items = blk["axes"][ax][:SUBS_PER_CELL]
            # build sub-factors
            subs = []
            for i, it in enumerate(items):
                # weight: earlier No. in the list slightly higher (representativeness)
                w = round(1.3 - i * 0.07, 2)
                mat = clamp(em[0] + (0.03 - i * 0.005))
                unc = clamp(em[1])
                sub_s = clamp(am[0])
                ctrl = clamp(am[1])
                ev = clamp(em[2])
                subs.append({
                    "id": f"{fid}-{it['no']}",
                    "name": js(it["name"]),
                    "description": js(it["summary"]),
                    "weight": w,
                    "maturity": mat, "uncertainty": unc,
                    "substitutability": sub_s, "controllability": ctrl,
                    "evidenceScore": ev,
                })
            factors.append({
                "id": fid,
                "name": f"{m['label']}・{era}",
                "category": m["category"],
                "description": js(f"{era}における{m['label']}領域の主要キーワード群（{len(blk['axes'][ax])}件中{len(items)}件を代表抽出）。"),
                "timeStart": sy, "timePeak": my, "timeEnd": ey + 4,
                "maturity": clamp(em[0]), "uncertainty": clamp(em[1]),
                "substitutability": clamp(am[0]), "controllability": clamp(am[1]),
                "evidenceScore": clamp(em[2]),
                "subs": subs,
            })

    # write factors
    out.append("const factors: Factor[] = [")
    for f in factors:
        out.append("  {")
        out.append(f"    id: '{f['id']}', name: '{f['name']}', category: '{f['category']}' as FactorCategory,")
        out.append(f"    description: '{f['description']}',")
        out.append(f"    timeStart: {f['timeStart']}, timePeak: {f['timePeak']}, timeEnd: {f['timeEnd']},")
        out.append(f"    maturity: {f['maturity']}, uncertainty: {f['uncertainty']}, substitutability: {f['substitutability']}, controllability: {f['controllability']}, evidenceScore: {f['evidenceScore']},")
        out.append("    subFactors: [")
        for s in f["subs"]:
            out.append(f"      {{ id: '{s['id']}', name: '{s['name']}', description: '{s['description']}', weight: {s['weight']}, maturity: {s['maturity']}, uncertainty: {s['uncertainty']}, substitutability: {s['substitutability']}, controllability: {s['controllability']}, evidenceScore: {s['evidenceScore']} }},")
        out.append("    ] as SubFactor[],")
        out.append("  },")
    out.append("];")
    out.append("")

    # ---- edges ----
    # (a) era progression within each axis: era_n -> era_n+1 (dependency, positive)
    by_axis = {ax: [] for ax in AXIS_ORDER}
    for fid, ax, era, my in factor_ids:
        by_axis[ax].append((fid, era, my))
    for ax in AXIS_ORDER:
        chain = by_axis[ax]
        for i in range(len(chain) - 1):
            a = chain[i][0]
            b = chain[i + 1][0]
            edges.append((a, b, "dependency", "positive", 0.7, 5, 0.7, "['roadmap']"))
    # (b) cross-axis within same era: technology -> market (enabler),
    #     market -> literacy (enabler), literacy -> culture (amplifier),
    #     technology -> culture (amplifier)
    eras_by_key = {}
    for fid, ax, era, my in factor_ids:
        eras_by_key.setdefault(era, {})[ax] = fid
    for era, axmap in eras_by_key.items():
        t, mk, li, cu = axmap.get("technology"), axmap.get("market"), axmap.get("literacy"), axmap.get("culture")
        if t and mk:
            edges.append((t, mk, "enabler", "positive", 0.72, 1, 0.7, "['tech-effect']"))
        if mk and li:
            edges.append((mk, li, "enabler", "positive", 0.55, 2, 0.6, "['roadmap']"))
        if li and cu:
            edges.append((li, cu, "amplifier", "positive", 0.5, 2, 0.58, "['roadmap']"))
        if t and cu:
            edges.append((t, cu, "amplifier", "positive", 0.6, 2, 0.62, "['roadmap']"))

    out.append("const edges = [")
    for (s, tg, rt, dr, w, lag, conf, ev) in edges:
        status = "reviewed" if conf >= 0.65 else "hypothesis"
        out.append(f"  {{ id: '{s}->{tg}', source: '{s}', target: '{tg}', relationshipType: '{rt}' as const, direction: '{dr}' as const, weight: {w}, timeLagYears: {lag}, confidence: {conf}, evidenceType: {ev}, status: '{status}' as const }},")
    out.append("];")
    out.append("")

    # ---- scenarios from PEST snapshots (2030 / 2040 / 2050) ----
    def pest_year(yr):
        for p in PEST:
            if p["year"] == yr:
                return p
        return None

    def top_kw(p, key, n=4):
        return [i["keyword"] for i in p[key][:n]]

    out.append("const scenarios = [")
    for yr, name, img in [
        ("2030年", "AGI・核融合の社会実装期（PESTスナップショット）", "自律AIエージェントと商用核融合が社会を再設計し、労働が義務から自己表現へ移行し始める未来。"),
        ("2040年", "マインドアップロード黎明・惑星管理期", "意識のデジタル化が初期実用化し、地球管理機構が気候と資源を統合制御する未来。"),
        ("2050年", "銀河人類・太陽系経済圏の確立", "人類の定義が地球生物から太陽系種へ拡張し、重力制御と物質転送が実用化する未来。"),
    ]:
        p = pest_year(yr)
        assum = top_kw(p, "technology", 3) + top_kw(p, "economy", 2) if p else []
        risks = top_kw(p, "politics", 2) + top_kw(p, "society", 2) if p else []
        a = ", ".join(f"'{js(x)}'" for x in assum)
        r = ", ".join(f"'{js(x)}'" for x in risks)
        out.append("  {")
        out.append(f"    id: 'rm-{yr[:4]}', name: '{js(name)}', targetYear: {int(yr[:4])},")
        out.append(f"    futureImage: '{js(img)}',")
        out.append(f"    assumptions: [{a}],")
        out.append(f"    risks: [{r}],")
        out.append("  },")
    out.append("];")
    out.append("")

    # ---- backcasts for the 2050 scenario ----
    out.append("const backcasts = {")
    out.append("  'rm-2050': [")
    bc = [
        (2050, "銀河人類・太陽系経済圏", ["重力制御の実用化", "太陽系規模の経済網", "地球の聖域化管理"]),
        (2045, "技術的特異点の到達", ["超知能(ASI)による統治", "物質的欠乏の終焉", "集合意識クラウドの形成"]),
        (2040, "惑星管理と意識拡張", ["地球管理機構の設立", "マインドアップロード初期実用", "軌道エレベーター稼働"]),
        (2035, "拡張人類の分岐", ["常温超伝導の送電網", "人工子宮の実用化", "クラウド国家の台頭"]),
        (2030, "AGIとエネルギー革命", ["商業核融合の稼働", "AGIの社会実装", "ポスト・ワーク時代の入口"]),
    ]
    for yr, title, conds in bc:
        c = ", ".join(f"'{js(x)}'" for x in conds)
        out.append(f"    {{ year: {yr}, title: '{js(title)}', conditions: [{c}] }},")
    out.append("  ],")
    out.append("};")
    out.append("")

    # ---- loops ----
    # reinforcing: technology -> market -> ... across early eras
    t2020 = "tec-2020"; m2020 = "mar-2020"; c2020 = "cul-2020"
    out.append("const loops = [")
    out.append("  {")
    out.append("    id: 'rm-loop-tech-market', name: '技術→市場→文化の加速ループ', type: 'reinforcing' as const,")
    out.append(f"    nodes: ['{t2020}', '{m2020}', '{c2020}', '{t2020}'],")
    out.append("    narrative: '技術キーワードが新市場を開き、市場の成功が文化的受容を生み、受容がさらなる技術投資を呼ぶ。ロードマップ初期の自己強化構造。',")
    out.append("  },")
    out.append("];")
    out.append("")

    # ---- the Project ----
    out.append("export const roadmapProject: Project = {")
    out.append("  id: 'roadmap',")
    out.append("  name: '未来ロードマップ 2020-2054',")
    out.append("  tagline: '4軸 × 7時代のキーワードを要素分解し、未来の急所を時系列で読み解く',")
    out.append("  description:")
    out.append("    'テクノロジー・マーケット・リテラシー・カルチャーの4軸で、2020年代から2050年代までの未来キーワードを時代ごとに分解した統合ロードマップ。各「時代×軸」を因子とし、その内部のキーワード群をサブ因子として保持することで、どの要素が未来の急所を生むかを分解分析できる。Tech Effectの市場・業界インパクトとPEST分析を統合。',")
    out.append("  horizonStart: 2020,")
    out.append("  horizonEnd: 2054,")
    out.append("  factors,")
    out.append("  edges,")
    out.append("  scenarios,")
    out.append("  backcasts,")
    out.append("  loops,")
    out.append("};")
    out.append("")

    with open("/home/user/webapp/src/data/roadmap.ts", "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print(f"Wrote roadmap.ts ({len(factors)} factors, {len(edges)} edges)")


if __name__ == "__main__":
    gen_data_ts()
    gen_project_ts()
