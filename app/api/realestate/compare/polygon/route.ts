import { withX402 } from "@x402/next";
import { compareHandler } from "@/lib/featureHandlers";
import {
  PAY_TO,
  POLYGON_NETWORK,
  jpycPriceFromUsd,
  x402Server,
} from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withX402(
  compareHandler,
  {
    accepts: [
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: "$0.50",
        network: POLYGON_NETWORK,
      },
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: jpycPriceFromUsd("$0.50"),
        network: POLYGON_NETWORK,
      },
    ],
    description: "Compare real estate yield across up to 5 areas (Polygon USDC/JPYC)",
  },
  x402Server,
);
