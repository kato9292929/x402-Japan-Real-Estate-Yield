import { withX402 } from "@x402/next";
import { compareHandler } from "@/lib/featureHandlers";
import { BASE_NETWORK, PAY_TO, x402Server } from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withX402(
  compareHandler,
  {
    accepts: {
      scheme: "exact",
      payTo: PAY_TO,
      price: "$0.50",
      network: BASE_NETWORK,
    },
    description: "Compare real estate yield across up to 5 areas",
  },
  x402Server,
);
