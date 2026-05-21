import { NextResponse, type NextRequest } from "next/server";
import { resolveArea, mapAreas, type PropertyType } from "@/lib/areas";
import { getAreaData } from "@/lib/japanData";
import {
  analyzeYield,
  analyzeCompare,
  analyzeForecast,
  generateWeeklyReport,
  type Horizon,
} from "@/lib/analysis";

/**
 * チェーン非依存のフィーチャーハンドラー。
 * 既存の route.ts（Base USDC）と同一ロジックを共有し、
 * solana / polygon / bnb のサブルートから再利用する。
 */

const PROPERTY_TYPES: PropertyType[] = ["apartment", "house", "commercial"];
const HORIZONS: Horizon[] = ["1Y", "3Y", "5Y"];

export async function yieldHandler(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  const area = resolveArea(params.get("area") ?? "tokyo");
  if (!area) {
    return NextResponse.json(
      {
        error: "unknown area",
        hint: "例: tokyo, osaka, fukuoka, nagoya, sapporo, kyoto, minato",
      },
      { status: 400 },
    );
  }

  const typeParam = (params.get("type") ?? "apartment") as PropertyType;
  const type: PropertyType = PROPERTY_TYPES.includes(typeParam)
    ? typeParam
    : "apartment";

  const data = await getAreaData(area.key);
  const analysis = await analyzeYield(data, type);

  return NextResponse.json({
    area: data.nameJa,
    analyzedAt: new Date().toISOString(),
    propertyType: type,
    yieldData: data.yieldData,
    marketData: {
      avgPriceManYen: data.avgPriceManYen,
      transactionCount: data.transactionCount,
    },
    analysis: {
      investmentScore: analysis.investmentScore,
      recommendation: analysis.recommendation,
      keyRisks: analysis.keyRisks,
      keyOpportunities: analysis.keyOpportunities,
      analysis_ja: analysis.analysis_ja,
      confidence: analysis.confidence,
    },
    analysisSource: analysis.source,
    dataSources: data.dataSources,
  });
}

export async function compareHandler(req: NextRequest): Promise<NextResponse> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const areasInput = (body as { areas?: unknown } | null)?.areas;
  if (!Array.isArray(areasInput)) {
    return NextResponse.json(
      { error: "body must be { areas: string[] } with 2-5 area keys" },
      { status: 400 },
    );
  }

  const keys = Array.from(
    new Set(areasInput.filter((v): v is string => typeof v === "string")),
  ).slice(0, 5);

  const resolved = keys
    .map((k) => resolveArea(k))
    .filter((a): a is NonNullable<typeof a> => a !== null);

  if (resolved.length < 2) {
    return NextResponse.json(
      { error: "could not resolve at least 2 valid areas" },
      { status: 400 },
    );
  }

  const data = await Promise.all(resolved.map((a) => getAreaData(a.key)));
  const analysis = await analyzeCompare(data);

  return NextResponse.json({
    comparedAt: new Date().toISOString(),
    areas: data.map((d) => d.nameJa),
    ranking: analysis.ranking,
    bestPick: analysis.bestPick,
    analysis_ja: analysis.analysis_ja,
    analysisSource: analysis.source,
  });
}

export async function forecastHandler(
  req: NextRequest,
): Promise<NextResponse> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const payload = body as { area?: unknown; horizon?: unknown } | null;
  const area =
    typeof payload?.area === "string" ? resolveArea(payload.area) : null;
  if (!area) {
    return NextResponse.json(
      { error: "body must include a valid { area: string }" },
      { status: 400 },
    );
  }

  const horizonInput = payload?.horizon;
  const horizon: Horizon =
    typeof horizonInput === "string" &&
    HORIZONS.includes(horizonInput as Horizon)
      ? (horizonInput as Horizon)
      : "3Y";

  const data = await getAreaData(area.key);
  const forecast = await analyzeForecast(data, horizon);

  return NextResponse.json({
    area: data.nameJa,
    horizon,
    forecastedAt: new Date().toISOString(),
    baseline: data.yieldData,
    forecast: {
      projectedGrossYield: forecast.projectedGrossYield,
      projectedNetYield: forecast.projectedNetYield,
      projectedPriceChange: forecast.projectedPriceChange,
      scenarios: forecast.scenarios,
      drivers: forecast.drivers,
      analysis_ja: forecast.analysis_ja,
      confidence: forecast.confidence,
    },
    analysisSource: forecast.source,
    dataSources: data.dataSources,
  });
}

export async function weeklyHandler(
  _req: NextRequest,
): Promise<NextResponse> {
  void _req;
  const data = await Promise.all(mapAreas().map((a) => getAreaData(a.key)));
  const report = await generateWeeklyReport(data);

  return NextResponse.json({
    title: report.title,
    weekOf: report.weekOf,
    generatedAt: new Date().toISOString(),
    highlights: report.highlights,
    report_ja: report.report_ja,
    marketSnapshot: data.map((d) => ({
      area: d.nameJa,
      grossYield: d.yieldData.grossYield,
      priceChange1Y: d.yieldData.priceChange1Y,
      vacancyRate: d.yieldData.vacancyRate,
    })),
    analysisSource: report.source,
  });
}
