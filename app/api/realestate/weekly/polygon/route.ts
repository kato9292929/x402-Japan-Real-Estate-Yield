import { withX402 } from "@x402/next";
import { weeklyHandler } from "@/lib/featureHandlers";
import {
  PAY_TO,
  POLYGON_NETWORK,
  jpycPriceFromUsd,
  x402Server,
} from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withX402(
  weeklyHandler,
  {
    accepts: [
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: "$2.00",
        network: POLYGON_NETWORK,
      },
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: jpycPriceFromUsd("$2.00"),
        network: POLYGON_NETWORK,
      },
    ],
    description: "Weekly Japan real estate market report (Polygon USDC/JPYC)",
  },
  x402Server,
);
