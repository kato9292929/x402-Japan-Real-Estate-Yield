import { callClaude, extractJson } from "./anthropic";
import type { AreaData } from "./japanData";
import type { PropertyType, Liquidity } from "./areas";
import { baselineFor } from "./japanData";
import {
  clamp,
  heuristicScore,
  round2,
  toRecommendation,
  type Recommendation,
  type YieldData,
} from "./score";

type Source = "claude" | "heuristic";

export interface YieldAnalysis {
  investmentScore: number;
  recommendation: Recommendation;
  keyRisks: string[];
  keyOpportunities: string[];
  analysis_ja: string;
  confidence: number;
  source: Source;
}

export interface CompareEntry {
  key: string;
  area: string;
  investmentScore: number;
  grossYield: number;
  vacancyRate: number;
  liquidity: Liquidity;
  rank: number;
}

export interface CompareAnalysis {
  ranking: CompareEntry[];
  bestPick: string;
  analysis_ja: string;
  source: Source;
}

export interface ForecastAnalysis {
  projectedGrossYield: number;
  projectedNetYield: number;
  projectedPriceChange: number;
  scenarios: { bull: number; base: number; bear: number };
  drivers: string[];
  analysis_ja: string;
  confidence: number;
  source: Source;
}

export interface WeeklyReport {
  title: string;
  weekOf: string;
  highlights: string[];
  report_ja: string;
  source: Source;
}

const PROPERTY_LABEL: Record<PropertyType, string> = {
  apartment: "区分マンション",
  house: "戸建て",
  commercial: "商業用不動産",
};

const asStringArray = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .slice(0, 5);
  return items.length > 0 ? items : fallback;
};

const asScore = (value: unknown, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return round2(clamp(value));
};

// ---------------------------------------------------------------- yield

export async function analyzeYield(
  data: AreaData,
  type: PropertyType,
): Promise<YieldAnalysis> {
  const heuristic = buildHeuristicYield(data, type);

  const system =
    "あなたは日本の不動産投資アナリストです。提供データのみに基づき、" +
    "冷静かつ実務的に分析し、必ず指定 JSON のみを返してください。";
  const user = [
    `対象エリア: ${data.nameJa}（${data.region}）`,
    `物件タイプ: ${PROPERTY_LABEL[type]}`,
    `データソース: ${data.dataSources.join(" / ")}`,
    `指標: ${JSON.stringify(data.yieldData)}`,
    `平均取得価格(万円): ${data.avgPriceManYen}`,
    `直近取引件数: ${data.transactionCount ?? "N/A"}`,
    "",
    "次の JSON 形式のみで回答してください:",
    "{",
    '  "investmentScore": 0.0〜1.0,',
    '  "recommendation": "ACCUMULATE"|"HOLD"|"NEUTRAL"|"CAUTION",',
    '  "keyRisks": ["..."],',
    '  "keyOpportunities": ["..."],',
    '  "analysis_ja": "150〜250字の日本語分析",',
    '  "confidence": 0.0〜1.0',
    "}",
  ].join("\n");

  const raw = await callClaude(system, user, 1024);
  const parsed = extractJson<Partial<YieldAnalysis>>(raw);
  if (!parsed || typeof parsed.analysis_ja !== "string") return heuristic;

  const investmentScore = asScore(parsed.investmentScore, heuristic.investmentScore);
  return {
    investmentScore,
    recommendation:
      typeof parsed.recommendation === "string"
        ? (parsed.recommendation as Recommendation)
        : toRecommendation(investmentScore),
    keyRisks: asStringArray(parsed.keyRisks, heuristic.keyRisks),
    keyOpportunities: asStringArray(
      parsed.keyOpportunities,
      heuristic.keyOpportunities,
    ),
    analysis_ja: parsed.analysis_ja.trim(),
    confidence: asScore(parsed.confidence, heuristic.confidence),
    source: "claude",
  };
}

function buildHeuristicYield(
  data: AreaData,
  type: PropertyType,
): YieldAnalysis {
  const { score, recommendation } = heuristicScore(data.yieldData);
  const y = data.yieldData;
  const risks: string[] = [];
  const opportunities: string[] = [];

  if (data.avgPriceManYen > 6000) risks.push("高い取得価格");
  if (y.grossYield < 0.04) risks.push("利回り水準の低さ");
  if (y.vacancyRate > 0.05) risks.push("空室リスク");
  risks.push("金利上昇リスク");
  if (y.priceChange1Y > 0.08) risks.push("価格過熱の調整リスク");

  if (y.populationTrend === "GROWING") opportunities.push("人口流入による賃貸需要");
  if (y.priceChange1Y > 0.04) opportunities.push("価格モメンタムの継続");
  if (y.grossYield > 0.045) opportunities.push("相対的に高い表面利回り");
  opportunities.push("インバウンド需要の回復");

  const baseline = baselineFor(data.key);
  if (baseline) opportunities.push(...baseline.highlights);

  const trendJa =
    y.populationTrend === "GROWING"
      ? "人口は増加basis"
      : y.populationTrend === "STABLE"
        ? "人口は横ばい"
        : "人口は減少傾向";
  const analysis_ja =
    `${data.nameJa}の${PROPERTY_LABEL[type]}は表面利回り` +
    `${(y.grossYield * 100).toFixed(1)}%、空室率${(y.vacancyRate * 100).toFixed(1)}%。` +
    `${trendJa}で、過去1年の価格は${(y.priceChange1Y * 100).toFixed(1)}%変動した。` +
    `総合投資スコアは${score.toFixed(2)}で判断は「${recommendation}」。` +
    `取得価格と金利動向を注視しつつ、賃貸需要の厚みを評価したい。`;

  return {
    investmentScore: score,
    recommendation,
    keyRisks: risks.slice(0, 4),
    keyOpportunities: Array.from(new Set(opportunities)).slice(0, 4),
    analysis_ja,
    confidence: 0.6,
    source: "heuristic",
  };
}

// -------------------------------------------------------------- compare

export async function analyzeCompare(
  areas: AreaData[],
): Promise<CompareAnalysis> {
  const heuristic = buildHeuristicCompare(areas);

  const system =
    "あなたは日本の不動産ポートフォリオアナリストです。提供データのみで" +
    "エリアを比較し、指定 JSON のみを返してください。";
  const user = [
    "以下のエリアを利回り・リスク・流動性で比較してください。",
    ...areas.map(
      (a) =>
        `- ${a.nameJa}: ${JSON.stringify(a.yieldData)} / 流動性=${a.liquidity} / 平均価格${a.avgPriceManYen}万円`,
    ),
    "",
    "次の JSON のみで回答:",
    "{",
    '  "bestPick": "最も妙味のあるエリア名",',
    '  "analysis_ja": "250〜400字の比較分析",',
    '  "scores": { "エリア名": 0.0〜1.0, ... }',
    "}",
  ].join("\n");

  const raw = await callClaude(system, user, 1280);
  const parsed = extractJson<{
    bestPick?: string;
    analysis_ja?: string;
    scores?: Record<string, number>;
  }>(raw);
  if (!parsed || typeof parsed.analysis_ja !== "string") return heuristic;

  const ranking = areas
    .map((a) => {
      const claudeScore = parsed.scores?.[a.nameJa];
      const score =
        typeof claudeScore === "number"
          ? round2(clamp(claudeScore))
          : heuristicScore(a.yieldData).score;
      return {
        key: a.key,
        area: a.nameJa,
        investmentScore: score,
        grossYield: a.yieldData.grossYield,
        vacancyRate: a.yieldData.vacancyRate,
        liquidity: a.liquidity,
        rank: 0,
      };
    })
    .sort((a, b) => b.investmentScore - a.investmentScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    ranking,
    bestPick: parsed.bestPick?.trim() || ranking[0]?.area || heuristic.bestPick,
    analysis_ja: parsed.analysis_ja.trim(),
    source: "claude",
  };
}

function buildHeuristicCompare(areas: AreaData[]): CompareAnalysis {
  const ranking: CompareEntry[] = areas
    .map((a) => ({
      key: a.key,
      area: a.nameJa,
      investmentScore: heuristicScore(a.yieldData).score,
      grossYield: a.yieldData.grossYield,
      vacancyRate: a.yieldData.vacancyRate,
      liquidity: a.liquidity,
      rank: 0,
    }))
    .sort((a, b) => b.investmentScore - a.investmentScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const best = ranking[0];
  const worst = ranking[ranking.length - 1];
  const analysis_ja =
    `比較対象${areas.length}エリアのうち、投資スコア最上位は${best.area}` +
    `（${best.investmentScore.toFixed(2)}・表面利回り${(best.grossYield * 100).toFixed(1)}%）。` +
    `最下位は${worst.area}（${worst.investmentScore.toFixed(2)}）。` +
    `流動性を重視するなら${ranking.find((r) => r.liquidity === "HIGH")?.area ?? best.area}、` +
    `利回りを重視するなら表面利回り最大の` +
    `${[...ranking].sort((a, b) => b.grossYield - a.grossYield)[0].area}が候補。` +
    `空室率と取得価格の差を踏まえ、分散取得を検討したい。`;

  return { ranking, bestPick: best.area, analysis_ja, source: "heuristic" };
}

// ------------------------------------------------------------- forecast

export type Horizon = "1Y" | "3Y" | "5Y";

export async function analyzeForecast(
  data: AreaData,
  horizon: Horizon,
): Promise<ForecastAnalysis> {
  const heuristic = buildHeuristicForecast(data, horizon);

  const system =
    "あなたは日本の不動産マーケットの予測アナリストです。人口動態・金利" +
    "見通し・開発計画を踏まえ、指定 JSON のみを返してください。";
  const user = [
    `対象エリア: ${data.nameJa}（${data.region}）`,
    `予測ホライズン: ${horizon}`,
    `現状指標: ${JSON.stringify(data.yieldData)}`,
    `平均取得価格(万円): ${data.avgPriceManYen}`,
    "",
    "次の JSON のみで回答:",
    "{",
    '  "projectedGrossYield": 0.0〜0.2,',
    '  "projectedPriceChange": -0.5〜1.0,',
    '  "scenarios": { "bull": 数値, "base": 数値, "bear": 数値 },',
    '  "drivers": ["..."],',
    '  "analysis_ja": "200〜350字の予測分析",',
    '  "confidence": 0.0〜1.0',
    "}",
  ].join("\n");

  const raw = await callClaude(system, user, 1280);
  const parsed = extractJson<{
    projectedGrossYield?: number;
    projectedPriceChange?: number;
    scenarios?: { bull?: number; base?: number; bear?: number };
    drivers?: string[];
    analysis_ja?: string;
    confidence?: number;
  }>(raw);
  if (!parsed || typeof parsed.analysis_ja !== "string") return heuristic;

  const projectedGrossYield =
    typeof parsed.projectedGrossYield === "number" &&
    parsed.projectedGrossYield > 0.005 &&
    parsed.projectedGrossYield < 0.2
      ? Number(parsed.projectedGrossYield.toFixed(4))
      : heuristic.projectedGrossYield;
  const projectedPriceChange =
    typeof parsed.projectedPriceChange === "number" &&
    Number.isFinite(parsed.projectedPriceChange)
      ? Number(parsed.projectedPriceChange.toFixed(4))
      : heuristic.projectedPriceChange;

  return {
    projectedGrossYield,
    projectedNetYield: Number((projectedGrossYield * 0.76).toFixed(4)),
    projectedPriceChange,
    scenarios: {
      bull: numberOr(parsed.scenarios?.bull, heuristic.scenarios.bull),
      base: numberOr(parsed.scenarios?.base, heuristic.scenarios.base),
      bear: numberOr(parsed.scenarios?.bear, heuristic.scenarios.bear),
    },
    drivers: asStringArray(parsed.drivers, heuristic.drivers),
    analysis_ja: parsed.analysis_ja.trim(),
    confidence: asScore(parsed.confidence, heuristic.confidence),
    source: "claude",
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(4))
    : fallback;
}

function buildHeuristicForecast(
  data: AreaData,
  horizon: Horizon,
): ForecastAnalysis {
  const years = horizon === "1Y" ? 1 : horizon === "3Y" ? 3 : 5;
  const y = data.yieldData;
  const trendFactor =
    y.populationTrend === "GROWING"
      ? 0.7
      : y.populationTrend === "STABLE"
        ? 0.4
        : -0.3;
  const annualGrowth = clamp(y.priceChange1Y * trendFactor, -0.06, 0.07);
  const projectedPriceChange = Number(
    (Math.pow(1 + annualGrowth, years) - 1).toFixed(4),
  );
  const yieldDrift =
    y.populationTrend === "GROWING"
      ? -0.02 * years
      : y.populationTrend === "DECLINING"
        ? 0.03 * years
        : 0.01 * years;
  const projectedGrossYield = Number(
    clamp(y.grossYield * (1 + yieldDrift), 0.01, 0.12).toFixed(4),
  );

  const drivers = [
    y.populationTrend === "GROWING"
      ? "人口集中の継続"
      : y.populationTrend === "STABLE"
        ? "人口横ばいによる需要安定"
        : "人口減少による需要縮小",
    "日銀の金融政策正常化と金利見通し",
    "再開発・インフラ投資の進捗",
    "インバウンド需要の構造的回復",
  ];
  const baseline = baselineFor(data.key);
  if (baseline) drivers.push(...baseline.highlights);

  const analysis_ja =
    `${data.nameJa}の${horizon}先予測。年率価格変動は約${(annualGrowth * 100).toFixed(1)}%を想定し、` +
    `期間累計で${(projectedPriceChange * 100).toFixed(1)}%。表面利回りは` +
    `${(y.grossYield * 100).toFixed(1)}%から${(projectedGrossYield * 100).toFixed(1)}%へ推移する見込み。` +
    `金利上昇は割引率を押し上げる一方、${data.region}の` +
    `${y.populationTrend === "GROWING" ? "人口集中" : "需要構造"}が下支え要因となる。` +
    `シナリオ間の振れ幅が大きく、取得タイミングの分散が有効。`;

  return {
    projectedGrossYield,
    projectedNetYield: Number((projectedGrossYield * 0.76).toFixed(4)),
    projectedPriceChange,
    scenarios: {
      bull: Number((projectedPriceChange + 0.06 * years * 0.4).toFixed(4)),
      base: projectedPriceChange,
      bear: Number((projectedPriceChange - 0.07 * years * 0.4).toFixed(4)),
    },
    drivers: Array.from(new Set(drivers)).slice(0, 5),
    analysis_ja,
    confidence: years <= 1 ? 0.62 : years <= 3 ? 0.52 : 0.42,
    source: "heuristic",
  };
}

// --------------------------------------------------------------- weekly

export async function generateWeeklyReport(
  areas: AreaData[],
): Promise<WeeklyReport> {
  const weekOf = new Date().toISOString().slice(0, 10);
  const heuristic = buildHeuristicWeekly(areas, weekOf);

  const system =
    "あなたは日本の不動産マーケットの週次レポートを執筆するアナリストです。" +
    "提供データに基づき、約2000字の日本語レポートを書いてください。";
  const user = [
    `週次レポート対象週: ${weekOf}`,
    "対象エリアの指標:",
    ...areas.map((a) => `- ${a.nameJa}: ${JSON.stringify(a.yieldData)}`),
    "",
    "次の JSON のみで回答:",
    "{",
    '  "highlights": ["3〜5個の要点"],',
    '  "report_ja": "約2000字の週次マーケットレポート（段落構成）"',
    "}",
  ].join("\n");

  const raw = await callClaude(system, user, 4096);
  const parsed = extractJson<{ highlights?: string[]; report_ja?: string }>(
    raw,
  );
  if (
    !parsed ||
    typeof parsed.report_ja !== "string" ||
    parsed.report_ja.length < 400
  ) {
    return heuristic;
  }

  return {
    title: "週次 日本不動産マーケットレポート",
    weekOf,
    highlights: asStringArray(parsed.highlights, heuristic.highlights),
    report_ja: parsed.report_ja.trim(),
    source: "claude",
  };
}

function buildHeuristicWeekly(
  areas: AreaData[],
  weekOf: string,
): WeeklyReport {
  const scored = areas
    .map((a) => ({ area: a, score: heuristicScore(a.yieldData).score }))
    .sort((a, b) => b.score - a.score);
  const top = scored[0];
  const topYield = [...areas].sort(
    (a, b) => b.yieldData.grossYield - a.yieldData.grossYield,
  )[0];

  const sections = scored.map(({ area, score }) => {
    const y = area.yieldData;
    return (
      `【${area.nameJa}】表面利回りは${(y.grossYield * 100).toFixed(1)}%、` +
      `実質利回りは${(y.netYield * 100).toFixed(1)}%。空室率${(y.vacancyRate * 100).toFixed(1)}%、` +
      `過去1年の価格変動は${(y.priceChange1Y * 100).toFixed(1)}%。` +
      `人口は${y.populationTrend === "GROWING" ? "増加" : y.populationTrend === "STABLE" ? "横ばい" : "減少"}基調で、` +
      `総合投資スコアは${score.toFixed(2)}。` +
      `流動性は${area.liquidity}で、価格指数は${y.priceIndex.toFixed(2)}。` +
      `${area.region}エリアの賃貸需要と取得価格のバランスを見極めたい局面が続く。`
    );
  });

  const report_ja = [
    `${weekOf}週の日本不動産マーケットレポート。`,
    `今週も主要都市の不動産市況はエリア間の二極化が続いた。` +
      `投資スコア最上位は${top.area.nameJa}（${top.score.toFixed(2)}）で、` +
      `表面利回りの観点では${topYield.nameJa}が${(topYield.yieldData.grossYield * 100).toFixed(1)}%と最も高い。` +
      `日銀の金融政策正常化を背景に長期金利の先高観が意識される一方、` +
      `インバウンド需要の回復と再開発の進捗が都心部の価格を下支えしている。`,
    "■ エリア別動向",
    ...sections,
    "■ 市場テーマ",
    `金利上昇局面では実質利回りの確保が一段と重要になる。表面利回りが` +
      `相対的に高い地方中核都市は妙味がある一方、流動性と空室リスクの管理が` +
      `課題となる。都心部は取得価格の高さが利回りを圧迫するものの、` +
      `賃料の底堅さと出口戦略の取りやすさが強み。`,
    "■ 来週の注目点",
    `金利関連の発表、再開発計画の進捗、インバウンド統計の更新がエリア別` +
      `スコアに影響しうる。AI資産運用エージェントは、利回り・流動性・` +
      `人口動態の3軸でポートフォリオの分散を継続的に点検することが推奨される。`,
    "本レポートは情報提供のみを目的としており、投資判断はご自身の責任で行ってください。",
  ].join("\n\n");

  return {
    title: "週次 日本不動産マーケットレポート",
    weekOf,
    highlights: [
      `投資スコア最上位: ${top.area.nameJa}（${top.score.toFixed(2)}）`,
      `表面利回り最大: ${topYield.nameJa}（${(topYield.yieldData.grossYield * 100).toFixed(1)}%）`,
      "金利先高観で実質利回りの確保が焦点",
      "インバウンド需要と再開発が都心価格を下支え",
    ],
    report_ja,
    source: "heuristic",
  };
}
