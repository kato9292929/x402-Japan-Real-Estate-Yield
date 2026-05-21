import type { NextRequest } from "next/server";
import type { RouteConfig } from "x402-next";

/**
 * Polygon 向け withX402 設定。USDC（既定）と JPYC を ?token= で切り替える。
 * JPYC は ERC20TokenAmount として明示的にアセットを指定する。
 */

const JPYC_CONTRACT = (process.env.NEXT_PUBLIC_JPYC_CONTRACT ??
  "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB") as `0x${string}`;

const JPYC_DECIMALS = 18;
/** JPYC 建て金額の換算に用いる想定レート（1 USD ≒ 150 JPY）。 */
const USD_JPY = 150;

function usdToNumber(priceUsd: string): number {
  return Number(priceUsd.replace(/[^0-9.]/g, "")) || 0;
}

/** USD 価格を JPYC（18 桁）の ERC20TokenAmount に換算する。 */
function jpycPrice(priceUsd: string): RouteConfig["price"] {
  const yen = Math.max(1, Math.round(usdToNumber(priceUsd) * USD_JPY));
  const amount = (
    BigInt(yen) * BigInt(10) ** BigInt(JPYC_DECIMALS)
  ).toString();
  return {
    amount,
    asset: {
      address: JPYC_CONTRACT,
      decimals: JPYC_DECIMALS,
      eip712: { name: "JPY Coin", version: "1" },
    },
  };
}

/**
 * Polygon の動的ルート設定を返す。?token=jpyc で JPYC、それ以外は USDC。
 */
export function polygonRouteConfig(
  priceUsd: string,
  description: string,
): (req: NextRequest) => Promise<RouteConfig> {
  return async (req: NextRequest): Promise<RouteConfig> => {
    const token = req.nextUrl.searchParams.get("token")?.toLowerCase();
    if (token === "jpyc") {
      return {
        price: jpycPrice(priceUsd),
        network: "polygon",
        config: { description: `${description} (JPYC)` },
      };
    }
    return {
      price: priceUsd,
      network: "polygon",
      config: { description: `${description} (USDC)` },
    };
  };
}
