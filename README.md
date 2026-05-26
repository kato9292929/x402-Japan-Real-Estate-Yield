# x402 Japan Real Estate Yield

> AI-powered real estate investment yield analysis for Japan, served as a
> multi-chain x402 v2 enabled API.
>
> 日本の不動産投資利回りをエリア別に AI 分析する、x402 v2 対応マルチチェーンデータ API。

[English](#english) ・ [日本語](#日本語)

---

## English

### Overview

**x402 Japan Real Estate Yield** is a Next.js 15 application that combines real
estate, interest rate, and demographic data from the Japan Data API, the
Ministry of Land, Infrastructure, Transport and Tourism (MLIT), and e-Stat, then
uses Claude to analyze expected yield, vacancy risk, and growth potential by
area. It is built for real estate investors and AI asset-management agents.

Every API endpoint is metered with the [x402](https://www.x402.org/) protocol
(v2). Payment is supported across **four chains**: Solana, Base, Polygon, and
BNB Chain.

### Features

- **Yield heatmap** of major Japanese cities rendered on a stylized Japan map.
- **Per-area analysis** of gross/net yield, vacancy risk, and investment score.
- **Multi-area comparison** ranking up to 5 areas by yield, risk, and liquidity.
- **Forward-looking forecast** (1Y / 3Y / 5Y) factoring in demographics,
  interest-rate outlook, and development plans.
- **Weekly market report** (~2,000 characters) covering major cities.
- **Multi-chain payments** with an in-app chain selector.
- Graceful fallback: when `ANTHROPIC_API_KEY` is unset, endpoints return a
  deterministic heuristic analysis instead of failing.

### x402 v2 architecture

Payments use the x402 **v2** protocol:

- `@x402/next` / `@x402/core` / `@x402/evm` (`2.13.0`) — v2 server SDK
- `@coinbase/x402` (`2.1.0`) — Coinbase CDP facilitator integration
- CAIP-2 network identifiers (`eip155:8453`, `eip155:137`, `eip155:56`,
  `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`)
- `x402Version: 2` in 402 payloads

`lib/x402.ts` constructs an `x402ResourceServer` from an
`HTTPFacilitatorClient` and registers the EVM `exact` scheme. Each route is
wrapped with `withX402(handler, routeConfig, x402Server)`.

Facilitator selection order:

1. **CDP keys** — if `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` are set, uses
   `createFacilitatorConfig()` from `@coinbase/x402` (production).
2. **`FACILITATOR_URL`** — falls back to a custom URL.
3. **Default** — `@x402/core` default facilitator.

### Multi-chain payments

Each endpoint is exposed per chain. The base `route.ts` serves Base USDC; the
other chains are added as sub-routes.

| Chain     | Token(s)     | Endpoint pattern                      | Mechanism             |
| --------- | ------------ | ------------------------------------- | --------------------- |
| Base      | USDC         | `/api/realestate/{feature}`           | v2 `withX402`         |
| Solana    | USDC         | `/api/realestate/{feature}/solana`    | manual 402 (v2 body)  |
| Polygon   | USDC · JPYC  | `/api/realestate/{feature}/polygon`   | v2 `withX402` (accepts array) |
| BNB Chain | USDT         | `/api/realestate/{feature}/bnb`       | manual 402 (v2 body)  |

`{feature}` is one of `yield`, `compare`, `forecast`, `weekly`.

- **Polygon JPYC** — the polygon route publishes both USDC and JPYC
  `PaymentOption`s in its `accepts` array. Clients pick by asset.
- **Solana / BNB** use a manual 402 response because `@x402/svm` is not in the
  dependency set and the CDP facilitator does not support BNB Chain.

JPYC token contract (Polygon): `0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB`.

### API

| Method | Endpoint                   | Price | Description                            |
| ------ | -------------------------- | ----- | -------------------------------------- |
| GET    | `/api/realestate/yield`    | $0.30 | Single-area yield analysis             |
| POST   | `/api/realestate/compare`  | $0.50 | Compare up to 5 areas                  |
| POST   | `/api/realestate/forecast` | $1.00 | 1Y / 3Y / 5Y yield forecast            |
| GET    | `/api/realestate/weekly`   | $2.00 | Weekly Japan real estate market report |

Append `/solana`, `/polygon`, or `/bnb` to any endpoint to pay on that chain.

**Query / body parameters**

- `yield` — `?area=tokyo&type=apartment|house|commercial`
- `compare` — `{ "areas": ["tokyo", "osaka", ...] }` (2–5 areas)
- `forecast` — `{ "area": "tokyo", "horizon": "1Y"|"3Y"|"5Y" }`

Supported area keys: `tokyo`, `osaka`, `fukuoka`, `nagoya`, `sapporo`,
`kyoto`, plus Tokyo wards `minato`, `chiyoda`, `shibuya`, `shinjuku`,
`setagaya`.

### Data sources

- **Japan Data API** — real estate price / demographics / interest rate / GDP.
- **MLIT** — Real Estate Transaction Price Information API (free).
- **e-Stat** — Japanese government statistics API (free, requires `ESTAT_API_KEY`).

When live data cannot be fetched, the app falls back to built-in baseline
metrics so responses are always available.

### Tech stack

- Next.js 15 / React 19
- `@x402/next` v2 + `@coinbase/x402` for per-route payment
- `@anthropic-ai/sdk` (Claude) for analysis
- `wagmi` / `viem` / `@rainbow-me/rainbowkit` for EVM wallets
- `@solana/wallet-adapter-*` (Phantom / Solflare) for Solana wallets

### Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                  # http://localhost:3000
npm run build                # production build
```

### Environment variables

| Variable                               | Description                                          |
| --------------------------------------- | ---------------------------------------------------- |
| `ANTHROPIC_API_KEY`                     | Claude API key (omit to use heuristic fallback)      |
| `CDP_API_KEY_ID`                        | **Required for production.** CDP API key ID (UUID)   |
| `CDP_API_KEY_SECRET`                    | **Required for production.** CDP API key secret      |
| `FACILITATOR_URL`                       | x402 facilitator URL (default CDP v2 endpoint)       |
| `WALLET_ADDRESS`                        | EVM receiving wallet (Base / Polygon / BNB)          |
| `WALLET_ADDRESS_BASE`                   | (optional) Base-specific receiving wallet            |
| `WALLET_ADDRESS_SOLANA`                 | Solana receiving wallet (base58, manual 402 routes)  |
| `HELIUS_RPC_URL`                        | Solana RPC endpoint (server)                         |
| `NEXT_PUBLIC_HELIUS_RPC_URL`            | Solana RPC endpoint (client)                         |
| `BNB_RPC_URL`                           | BNB Chain RPC endpoint                               |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`  | WalletConnect project ID                             |
| `NEXT_PUBLIC_JPYC_CONTRACT`             | JPYC token contract (Polygon)                        |
| `NEXT_PUBLIC_USDT_BNB_CONTRACT`         | USDT token contract (BNB Chain)                      |
| `ESTAT_API_KEY`                         | e-Stat API key (free registration)                   |

#### CDP API key (production payments)

1. Sign in to the [Coinbase Developer Platform](https://portal.cdp.coinbase.com/).
2. Create a new API key. The key ID is a UUID and the secret is a base64
   string ending in `==`.
3. Set `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` as Vercel environment
   variables.
4. `FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402` (default).

The receiving wallet (`WALLET_ADDRESS`) must be set to the address that should
receive the USDC payments. The default placeholder
`0xC67d94504696960bA0f2e7C3FeE703950734c00A` is **not** controlled by you.

### Deployment

Designed for Vercel. Set the environment variables above in the project
settings and deploy.

Build-time warnings about the facilitator returning HTTP 403 (`Host not in
allowlist`) are expected outside Vercel because outbound network access is
sandboxed; production builds on Vercel reach the CDP facilitator normally.

### Disclaimer

This tool is for informational purposes only. Real estate investment carries
risk. Make investment decisions at your own discretion.

---

## 日本語

### 概要

**x402 Japan Real Estate Yield** は、Japan Data API・国土交通省・e-Stat が持つ
不動産・金利・人口統計データを統合し、エリア別の期待利回り・空室リスク・
将来性を Claude が分析する Next.js 15 アプリケーションです。

すべての API エンドポイントは [x402 v2](https://www.x402.org/) プロトコルで
都度課金されます。決済は **4 チェーン**（Solana・Base・Polygon・BNB Chain）に
対応します。

### x402 v2 アーキテクチャ

- `@x402/next` / `@x402/core` / `@x402/evm`（`2.13.0`）— v2 サーバー SDK
- `@coinbase/x402`（`2.1.0`）— Coinbase CDP facilitator 連携
- CAIP-2 ネットワーク識別子（`eip155:8453`・`eip155:137`・`eip155:56`・
  `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`）
- 402 ペイロードに `x402Version: 2`

`lib/x402.ts` で `HTTPFacilitatorClient` から `x402ResourceServer` を構築し
EVM `exact` スキームを登録します。各ルートは
`withX402(handler, routeConfig, x402Server)` でラップします。

facilitator 自動選択順:

1. **CDP keys** — `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` があれば
   `@coinbase/x402` の `createFacilitatorConfig()` を使用（本番）
2. **`FACILITATOR_URL`** — 任意 URL へフォールバック
3. **default** — `@x402/core` のデフォルト facilitator

### マルチチェーン決済

| チェーン   | トークン     | エンドポイント                          | 実装方式                     |
| ---------- | ------------ | --------------------------------------- | ---------------------------- |
| Base       | USDC         | `/api/realestate/{feature}`             | v2 `withX402`                |
| Solana     | USDC         | `/api/realestate/{feature}/solana`      | 手動 402（v2 ボディ）        |
| Polygon    | USDC・JPYC   | `/api/realestate/{feature}/polygon`     | v2 `withX402`（accepts 配列） |
| BNB Chain  | USDT         | `/api/realestate/{feature}/bnb`         | 手動 402（v2 ボディ）        |

- **Polygon の JPYC** — polygon ルートは USDC と JPYC の 2 つの
  `PaymentOption` を `accepts` 配列で公開。クライアントがアセットで選択
- **Solana・BNB** は `@x402/svm` 未採用かつ CDP facilitator が BNB を
  サポートしないため、手動 402 を返す

JPYC トークンコントラクト（Polygon）：`0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB`

### API

| メソッド | エンドポイント             | 料金  | 説明                            |
| -------- | -------------------------- | ----- | ------------------------------- |
| GET      | `/api/realestate/yield`    | $0.30 | 単一エリアの利回り分析          |
| POST     | `/api/realestate/compare`  | $0.50 | 最大5エリアの比較               |
| POST     | `/api/realestate/forecast` | $1.00 | 1年/3年/5年の利回り予測         |
| GET      | `/api/realestate/weekly`   | $2.00 | 週次 日本不動産マーケットレポート |

各エンドポイントに `/solana`・`/polygon`・`/bnb` を付与すると、そのチェーンで
決済します。

### 環境変数

| 変数                                    | 説明                                                 |
| --------------------------------------- | ---------------------------------------------------- |
| `ANTHROPIC_API_KEY`                     | Claude API キー（未設定時はヒューリスティック分析）  |
| `CDP_API_KEY_ID`                        | **本番必須**。CDP API キー ID（UUID）                |
| `CDP_API_KEY_SECRET`                    | **本番必須**。CDP API キーシークレット               |
| `FACILITATOR_URL`                       | x402 ファシリテーターの URL（既定 CDP v2）           |
| `WALLET_ADDRESS`                        | EVM 収益受領ウォレット（Base / Polygon / BNB）       |
| `WALLET_ADDRESS_BASE`                   | （任意）Base 専用受領ウォレット                      |
| `WALLET_ADDRESS_SOLANA`                 | Solana 収益受領ウォレット（base58・手動 402）        |
| `HELIUS_RPC_URL`                        | Solana RPC エンドポイント（サーバー）                |
| `NEXT_PUBLIC_HELIUS_RPC_URL`            | Solana RPC エンドポイント（クライアント）            |
| `BNB_RPC_URL`                           | BNB Chain RPC エンドポイント                         |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`  | WalletConnect プロジェクト ID                        |
| `NEXT_PUBLIC_JPYC_CONTRACT`             | JPYC トークンコントラクト（Polygon）                 |
| `NEXT_PUBLIC_USDT_BNB_CONTRACT`         | USDT トークンコントラクト（BNB Chain）               |
| `ESTAT_API_KEY`                         | e-Stat API キー（無料登録）                          |

#### CDP API キーの設定（本番決済）

1. [Coinbase Developer Platform](https://portal.cdp.coinbase.com/) にサイン
   インし、API キーを発行
2. キー ID は UUID、シークレットは末尾 `==` の base64 文字列
3. Vercel のプロジェクト環境変数に `CDP_API_KEY_ID` と `CDP_API_KEY_SECRET`
   を登録
4. `FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402`（既定）

`WALLET_ADDRESS` は収益受領アドレスへ必ず差し替えてください。コード上の
デフォルト値（`0xC67d94504696960bA0f2e7C3FeE703950734c00A`）はあなたが管理
していないアドレスです。

### デプロイ

Vercel での運用を想定しています。上記の環境変数を設定してデプロイしてください。

ビルド時にファシリテーターが HTTP 403（`Host not in allowlist`）になるのは
sandbox の外向きネットワーク制限による既知の挙動です。Vercel 上では正常に
到達します。

### 免責事項

本ツールは情報提供のみを目的としています。不動産投資にはリスクが伴います。
投資判断はご自身でお願いします。
