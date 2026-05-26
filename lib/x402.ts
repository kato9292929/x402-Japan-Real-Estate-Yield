import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type { FacilitatorConfig } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";

const DEFAULT_PAY_TO = "0xC67d94504696960bA0f2e7C3FeE703950734c00A";

export const PAY_TO = (process.env.WALLET_ADDRESS ??
  DEFAULT_PAY_TO) as `0x${string}`;

// CAIP-2 ネットワーク識別子（x402 v2）
export const BASE_NETWORK = "eip155:8453" as const;
export const POLYGON_NETWORK = "eip155:137" as const;

function buildFacilitatorConfig(): FacilitatorConfig {
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  if (apiKeyId && apiKeySecret) {
    return createFacilitatorConfig(apiKeyId, apiKeySecret);
  }
  const url = process.env.FACILITATOR_URL;
  if (url && /^https?:\/\//.test(url)) {
    return { url };
  }
  return {};
}

const facilitatorClient = new HTTPFacilitatorClient(buildFacilitatorConfig());

export const x402Server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(x402Server);

// ---------------------------------------------------------------- JPYC

export const JPYC_CONTRACT = (process.env.NEXT_PUBLIC_JPYC_CONTRACT ??
  "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB") as `0x${string}`;

const JPYC_DECIMALS = 18;
/** JPYC 建て金額の換算に用いる想定レート（1 USD ≒ 150 JPY）。 */
const USD_JPY = 150;

/** USD 価格を JPYC（18 桁・Polygon）の AssetAmount に換算する。 */
export function jpycPriceFromUsd(priceUsd: string): {
  asset: string;
  amount: string;
} {
  const usd = Number(priceUsd.replace(/[^0-9.]/g, "")) || 0;
  const yen = Math.max(1, Math.round(usd * USD_JPY));
  const amount = (
    BigInt(yen) * BigInt(10) ** BigInt(JPYC_DECIMALS)
  ).toString();
  return { asset: JPYC_CONTRACT, amount };
}

// ----------------------------------------- 上流 API への best-effort fetch

/**
 * Japan Data API などの上流エンドポイントを叩くための fetch ラッパー。
 * 上流が 402 を返した場合は呼び出し側がベースラインへフォールバックする。
 */
export async function fetchWithX402(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers: HeadersInit = {
    Accept: "application/json",
    "User-Agent": "x402-japan-realestate-yield/0.2",
    ...(init?.headers ?? {}),
  };
  return fetch(url, {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(8000),
    cache: "no-store",
  });
}

/** JSON を取得し、ネットワークエラー・402・非 200 は null を返す。 */
export async function fetchJsonWithX402<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchWithX402(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
