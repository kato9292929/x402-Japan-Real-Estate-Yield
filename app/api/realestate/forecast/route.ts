import { NextResponse, type NextRequest } from "next/server";
import { withX402 } from "x402-next";
import { resolveArea } from "@/lib/areas";
import { getAreaData } from "@/lib/japanData";
import { analyzeForecast, type Horizon } from "@/lib/analysis";
import { FACILITATOR, PAY_TO, PAYWALL, route } from "@/lib/x402Config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HORIZONS: Horizon[] = ["1Y", "3Y", "5Y"];

async function handler(req: NextRequest): Promise<NextResponse> {
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

export const POST = withX402(
  handler,
  PAY_TO,
  route("$1.00", "Forward-looking real estate yield forecast"),
  FACILITATOR,
  PAYWALL,
);
