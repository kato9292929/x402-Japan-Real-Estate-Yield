import { NextResponse, type NextRequest } from "next/server";

/**
 * Solana / BNB Chain 向けの手動 402（manual 402）実装。
 *
 * x402-next の withX402 は Network 型に solana の決済署名検証や
 * BNB Chain（"bnb"）を含まないため、これらのチェーンは withX402 を
 * 使わず x402 仕様準拠の 402 レスポンスを手動で返す。
 */

const SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_BNB = "0x55d398326f99059fF775485246999027B3197955";
const BNB_CHAIN_ID = 56;

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
      network: "solana-mainnet",
      asset: SOLANA_USDC,
      payTo: process.env.SOLANA_WALLET_ADDRESS ?? "",
    };
  }
  return {
    network: `eip155:${BNB_CHAIN_ID}`,
    asset: USDT_BNB,
    payTo: process.env.WALLET_ADDRESS ?? "",
  };
}

/** x402 仕様の 402 Payment Required レスポンスを生成する。 */
export function paymentRequired(
  chain: ManualChain,
  req: NextRequest,
  maxAmountRequired: string,
  description: string,
): NextResponse {
  const spec = chainSpec(chain);
  return new NextResponse(
    JSON.stringify({
      x402Version: 1,
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
 * 本番では X-PAYMENT の決済をファシリテーターで検証・決済する必要がある。
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
