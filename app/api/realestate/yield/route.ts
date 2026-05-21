import { NextResponse, type NextRequest } from "next/server";
import { withX402 } from "x402-next";
import { resolveArea, type PropertyType } from "@/lib/areas";
import { getAreaData } from "@/lib/japanData";
import { analyzeYield } from "@/lib/analysis";
import { FACILITATOR, PAY_TO, PAYWALL, route } from "@/lib/x402Config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROPERTY_TYPES: PropertyType[] = ["apartment", "house", "commercial"];

async function handler(req: NextRequest): Promise<NextResponse> {
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

export const GET = withX402(
  handler,
  PAY_TO,
  route("$0.30", "Japan real estate yield analysis by area"),
  FACILITATOR,
  PAYWALL,
);
