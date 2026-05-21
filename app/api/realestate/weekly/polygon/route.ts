import { withX402 } from "x402-next";
import { weeklyHandler } from "@/lib/featureHandlers";
import { FACILITATOR, PAY_TO, PAYWALL } from "@/lib/x402Config";
import { polygonRouteConfig } from "@/lib/x402Polygon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withX402(
  weeklyHandler,
  PAY_TO,
  polygonRouteConfig("$2.00", "Weekly Japan real estate market report"),
  FACILITATOR,
  PAYWALL,
);
