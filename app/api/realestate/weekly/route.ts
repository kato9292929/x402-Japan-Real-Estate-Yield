import { NextResponse, type NextRequest } from "next/server";
import { withX402 } from "x402-next";
import { mapAreas } from "@/lib/areas";
import { getAreaData } from "@/lib/japanData";
import { generateWeeklyReport } from "@/lib/analysis";
import { FACILITATOR, PAY_TO, PAYWALL, route } from "@/lib/x402Config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(_req: NextRequest): Promise<NextResponse> {
  void _req;
  const data = await Promise.all(
    mapAreas().map((a) => getAreaData(a.key)),
  );
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

export const GET = withX402(
  handler,
  PAY_TO,
  route("$2.00", "Weekly Japan real estate market report"),
  FACILITATOR,
  PAYWALL,
);
