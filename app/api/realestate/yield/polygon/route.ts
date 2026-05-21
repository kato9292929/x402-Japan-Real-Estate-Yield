import { withX402 } from "x402-next";
import { yieldHandler } from "@/lib/featureHandlers";
import { FACILITATOR, PAY_TO, PAYWALL } from "@/lib/x402Config";
import { polygonRouteConfig } from "@/lib/x402Polygon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withX402(
  yieldHandler,
  PAY_TO,
  polygonRouteConfig("$0.30", "Japan real estate yield analysis by area"),
  FACILITATOR,
  PAYWALL,
);
