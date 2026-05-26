import { withX402 } from "@x402/next";
import { yieldHandler } from "@/lib/featureHandlers";
import {
  PAY_TO,
  POLYGON_NETWORK,
  jpycPriceFromUsd,
  x402Server,
} from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withX402(
  yieldHandler,
  {
    accepts: [
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: "$0.30",
        network: POLYGON_NETWORK,
      },
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: jpycPriceFromUsd("$0.30"),
        network: POLYGON_NETWORK,
      },
    ],
    description: "Japan real estate yield analysis by area (Polygon USDC/JPYC)",
  },
  x402Server,
);
