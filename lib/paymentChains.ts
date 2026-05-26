export type ChainKey = "solana" | "base" | "polygon" | "bnb";
export type TokenKey = "usdc" | "jpyc" | "usdt";

export interface PaymentChain {
  key: ChainKey;
  label: string;
  /** CAIP-2 ネットワーク識別子。 */
  network: string;
  tokens: TokenKey[];
  disabledTokens: TokenKey[];
  banner: string | null;
  /** API ルートのサブパス（Base は既存 route.ts なので空）。 */
  routeSuffix: string;
}

export const DEFAULT_CHAIN: ChainKey = "solana";

export const PAYMENT_CHAINS: PaymentChain[] = [
  {
    key: "solana",
    label: "Solana",
    network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    tokens: ["usdc"],
    disabledTokens: ["jpyc"],
    banner: "SolanaネットワークではUSDC決済のみご利用いただけます",
    routeSuffix: "/solana",
  },
  {
    key: "base",
    label: "Base",
    network: "eip155:8453",
    tokens: ["usdc", "jpyc"],
    disabledTokens: [],
    banner: null,
    routeSuffix: "",
  },
  {
    key: "polygon",
    label: "Polygon",
    network: "eip155:137",
    tokens: ["usdc", "jpyc"],
    disabledTokens: [],
    banner: null,
    routeSuffix: "/polygon",
  },
  {
    key: "bnb",
    label: "BNB Chain",
    network: "eip155:56",
    tokens: ["usdt"],
    disabledTokens: [],
    banner: "BNB ChainではUSDT決済のみご利用いただけます",
    routeSuffix: "/bnb",
  },
];

export const TOKEN_LABEL: Record<TokenKey, string> = {
  usdc: "USDC",
  jpyc: "JPYC",
  usdt: "USDT",
};

export function chainByKey(key: ChainKey): PaymentChain {
  return PAYMENT_CHAINS.find((c) => c.key === key) ?? PAYMENT_CHAINS[0];
}

/** 選択されたチェーン・トークンに応じた利回り API のリンクを組み立てる。 */
export function yieldEndpoint(
  chainKey: ChainKey,
  token: TokenKey,
  areaKey: string,
): string {
  const chain = chainByKey(chainKey);
  const params = new URLSearchParams({ area: areaKey });
  if (chainKey === "polygon" && token === "jpyc") {
    params.set("token", "jpyc");
  }
  return `/api/realestate/yield${chain.routeSuffix}?${params.toString()}`;
}
