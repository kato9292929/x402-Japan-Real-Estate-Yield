import { withX402 } from "x402-next";
import { compareHandler } from "@/lib/featureHandlers";
import { FACILITATOR, PAY_TO, PAYWALL } from "@/lib/x402Config";
import { polygonRouteConfig } from "@/lib/x402Polygon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withX402(
  compareHandler,
  PAY_TO,
  polygonRouteConfig("$0.50", "Compare real estate yield across up to 5 areas"),
  FACILITATOR,
  PAYWALL,
);
