import type { Address } from "viem";
import type { Resource, RouteConfig } from "x402-next";

/** 収益受領アドレス（WALLET_ADDRESS）。 */
export const PAY_TO = (process.env.WALLET_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as Address;

/** x402 ファシリテーター設定。 */
export const FACILITATOR = {
  url: (process.env.FACILITATOR_URL ??
    "https://api.developer.coinbase.com/rpc/v1/base/facilitator") as Resource,
};

/** ブラウザ向けペイウォール設定。 */
export const PAYWALL = {
  appName: "x402 Japan Real Estate Yield",
};

/** ルート単位の x402 課金設定を組み立てる。 */
export function route(price: string, description: string): RouteConfig {
  return {
    price,
    network: "base",
    config: { description },
  };
}
