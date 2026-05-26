import { withX402 } from "@x402/next";
import { yieldHandler } from "@/lib/featureHandlers";
import { BASE_NETWORK, PAY_TO, x402Server } from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withX402(
  yieldHandler,
  {
    accepts: {
      scheme: "exact",
      payTo: PAY_TO,
      price: "$0.30",
      network: BASE_NETWORK,
    },
    description: "Japan real estate yield analysis by area",
  },
  x402Server,
);
