import { NextResponse, type NextRequest } from "next/server";
import { withX402 } from "x402-next";
import { resolveArea } from "@/lib/areas";
import { getAreaData } from "@/lib/japanData";
import { analyzeCompare } from "@/lib/analysis";
import { FACILITATOR, PAY_TO, PAYWALL, route } from "@/lib/x402Config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest): Promise<NextResponse> {
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
    new Set(
      areasInput.filter((v): v is string => typeof v === "string"),
    ),
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

export const POST = withX402(
  handler,
  PAY_TO,
  route("$0.50", "Compare real estate yield across up to 5 areas"),
  FACILITATOR,
  PAYWALL,
);
