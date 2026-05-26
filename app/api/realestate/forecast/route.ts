import { withX402 } from "@x402/next";
import { forecastHandler } from "@/lib/featureHandlers";
import { BASE_NETWORK, PAY_TO, x402Server } from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withX402(
  forecastHandler,
  {
    accepts: {
      scheme: "exact",
      payTo: PAY_TO,
      price: "$1.00",
      network: BASE_NETWORK,
    },
    description: "Forward-looking real estate yield forecast",
  },
  x402Server,
);
