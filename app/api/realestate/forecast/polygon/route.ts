import { withX402 } from "x402-next";
import { forecastHandler } from "@/lib/featureHandlers";
import { FACILITATOR, PAY_TO, PAYWALL } from "@/lib/x402Config";
import { polygonRouteConfig } from "@/lib/x402Polygon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withX402(
  forecastHandler,
  PAY_TO,
  polygonRouteConfig("$1.00", "Forward-looking real estate yield forecast"),
  FACILITATOR,
  PAYWALL,
);
