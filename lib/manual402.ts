import { NextResponse, type NextRequest } from "next/server";

/**
 * Solana / BNB Chain 向けの手動 402（manual 402）実装（x402 v2 形式）。
 *
 * - Solana は @x402/svm を本リポジトリで採用していないため手動 402
 * - BNB Chain は v2 でも CDP facilitator がサポート外のため手動 402
 *
 * いずれも v2 仕様に合わせ x402Version: 2 と CAIP-2 ネットワーク識別子を返す。
 */

const SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_BNB = "0x55d398326f99059fF775485246999027B3197955";

export const SOLANA_NETWORK =
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as const;
export const BNB_NETWORK = "eip155:56" as const;

export type ManualChain = "solana" | "bnb";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-payment, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface ChainPaymentSpec {
  network: string;
  asset: string;
  payTo: string;
}

function chainSpec(chain: ManualChain): ChainPaymentSpec {
  if (chain === "solana") {
    return {
      network: SOLANA_NETWORK,
      asset: SOLANA_USDC,
      payTo:
        process.env.WALLET_ADDRESS_SOLANA ??
        process.env.SOLANA_WALLET_ADDRESS ??
        "",
    };
  }
  return {
    network: BNB_NETWORK,
    asset: USDT_BNB,
    payTo:
      process.env.WALLET_ADDRESS_BASE ??
      process.env.WALLET_ADDRESS ??
      "0xC67d94504696960bA0f2e7C3FeE703950734c00A",
  };
}

/** x402 v2 仕様の 402 Payment Required レスポンスを生成する。 */
export function paymentRequired(
  chain: ManualChain,
  req: NextRequest,
  maxAmountRequired: string,
  description: string,
): NextResponse {
  const spec = chainSpec(chain);
  return new NextResponse(
    JSON.stringify({
      x402Version: 2,
      error: "Payment Required",
      accepts: [
        {
          scheme: "exact",
          network: spec.network,
          maxAmountRequired,
          resource: req.url,
          description,
          mimeType: "application/json",
          payTo: spec.payTo,
          maxTimeoutSeconds: 300,
          asset: spec.asset,
        },
      ],
    }),
    {
      status: 402,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    },
  );
}

/**
 * 手動 402 でハンドラーをラップする。X-PAYMENT ヘッダーが無ければ 402 を返す。
 * 本番では X-PAYMENT の決済をオンチェーン RPC かファシリテーターで
 * 検証・決済する必要がある（未実装）。
 */
export function withManual402(
  chain: ManualChain,
  handler: (req: NextRequest) => Promise<NextResponse>,
  maxAmountRequired: string,
  description: string,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!req.headers.get("X-PAYMENT")) {
      return paymentRequired(chain, req, maxAmountRequired, description);
    }
    const res = await handler(req);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  };
}

/** CORS プリフライト（OPTIONS）応答。 */
export function corsPreflight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
