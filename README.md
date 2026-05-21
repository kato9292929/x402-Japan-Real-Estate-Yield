# x402 Japan Real Estate Yield

> AI-powered real estate investment yield analysis for Japan, served as a
> multi-chain x402-enabled API.
>
> 日本の不動産投資利回りをエリア別に AI 分析する、マルチチェーン x402 対応データ API。

[English](#english) ・ [日本語](#日本語)

---

## English

### Overview

**x402 Japan Real Estate Yield** is a Next.js 15 application that combines real
estate, interest rate, and demographic data from the Japan Data API, the
Ministry of Land, Infrastructure, Transport and Tourism (MLIT), and e-Stat, then
uses Claude to analyze expected yield, vacancy risk, and growth potential by
area. It is built for real estate investors and AI asset-management agents.

Every API endpoint is metered with the [x402](https://www.x402.org/) protocol —
no API keys, pay per request. Payment is supported across **four chains**:
Solana, Base, Polygon, and BNB Chain.

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

### Multi-chain payments

Each endpoint is exposed per chain. The base `route.ts` serves Base USDC; the
other chains are added as sub-routes.

| Chain     | Token(s)     | Endpoint pattern                      | Mechanism    |
| --------- | ------------ | ------------------------------------- | ------------ |
| Base      | USDC         | `/api/realestate/{feature}`           | `withX402`   |
| Solana    | USDC         | `/api/realestate/{feature}/solana`    | manual 402   |
| Polygon   | USDC · JPYC  | `/api/realestate/{feature}/polygon`   | `withX402`   |
| BNB Chain | USDT         | `/api/realestate/{feature}/bnb`       | manual 402   |

`{feature}` is one of `yield`, `compare`, `forecast`, `weekly`.

- **Polygon JPYC** — append `?token=jpyc` to settle in JPYC instead of USDC.
- **Solana** uses a manual x402-spec 402 response (`network: "solana-mainnet"`,
  USDC `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`).
- **BNB Chain** also uses a manual 402 (`network: "eip155:56"`, USDT
  `0x55d398326f99059fF775485246999027B3197955`) because `x402-next` 1.2.0 does
  not include BNB Chain in its `Network` type.
- **Base / Polygon** are wrapped with `x402-next`'s `withX402`.

**Chain selector UI**

- Default chain: **Solana**.
- Solana → USDC only (JPYC tab is shown but disabled).
- Base / Polygon → USDC · JPYC.
- BNB Chain → USDT only.

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
- Polygon only — `?token=jpyc` to pay in JPYC

Supported area keys: `tokyo`, `osaka`, `fukuoka`, `nagoya`, `sapporo`,
`kyoto`, plus Tokyo wards `minato`, `chiyoda`, `shibuya`, `shinjuku`,
`setagaya`.

**Example response (`/api/realestate/yield`)**

```json
{
  "area": "港区",
  "analyzedAt": "2026-05-21T00:00:00Z",
  "yieldData": {
    "grossYield": 0.042,
    "netYield": 0.031,
    "priceIndex": 1.24,
    "priceChange1Y": 0.087,
    "vacancyRate": 0.032,
    "populationTrend": "GROWING"
  },
  "analysis": {
    "investmentScore": 0.78,
    "recommendation": "ACCUMULATE",
    "keyRisks": ["高い取得価格", "金利上昇リスク"],
    "keyOpportunities": ["インバウンド需要回復", "再開発計画"],
    "analysis_ja": "港区は高い取得価格ながら安定した賃料収入と...",
    "confidence": 0.82
  }
}
```

### Data sources

- **Japan Data API** — real estate price / demographics / interest rate / GDP
  (accessed via x402).
- **MLIT** — Real Estate Transaction Price Information API (free).
- **e-Stat** — Japanese government statistics API (free, requires `ESTAT_API_KEY`).

When live data cannot be fetched (e.g. unpaid 402, network error), the app falls
back to built-in baseline metrics so responses are always available.

### Tech stack

- Next.js 15 / React 19
- `x402-next` for per-route payment (`withX402`) + manual 402 for Solana / BNB
- `@anthropic-ai/sdk` (Claude) for analysis
- `wagmi` / `viem` / `@rainbow-me/rainbowkit` for EVM wallets (Base / Polygon / BNB)
- `@solana/wallet-adapter-*` (Phantom / Solflare) for Solana wallets

### Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                  # http://localhost:3000
npm run build                # production build
```

### Environment variables

| Variable                               | Description                                       |
| --------------------------------------- | ------------------------------------------------- |
| `ANTHROPIC_API_KEY`                     | Claude API key (omit to use heuristic fallback)   |
| `WALLET_ADDRESS`                        | EVM receiving wallet (Base / Polygon / BNB)       |
| `SOLANA_WALLET_ADDRESS`                 | Solana receiving wallet (base58)                  |
| `HELIUS_RPC_URL`                        | Solana RPC endpoint (server)                      |
| `NEXT_PUBLIC_HELIUS_RPC_URL`            | Solana RPC endpoint (client)                      |
| `FACILITATOR_URL`                       | x402 facilitator endpoint                         |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`  | WalletConnect project ID                          |
| `NEXT_PUBLIC_JPYC_CONTRACT`             | JPYC token contract (Polygon)                     |
| `NEXT_PUBLIC_USDT_BNB_CONTRACT`         | USDT token contract (BNB Chain)                   |
| `BNB_RPC_URL`                           | BNB Chain RPC endpoint                            |
| `ESTAT_API_KEY`                         | e-Stat API key (free registration)                |

### Deployment

Designed for Vercel. Set the environment variables above in the project
settings and deploy.

### Disclaimer

This tool is for informational purposes only. Real estate investment carries
risk. Make investment decisions at your own discretion.

---

## 日本語

### 概要

**x402 Japan Real Estate Yield** は、Japan Data API・国土交通省・e-Stat が持つ
不動産・金利・人口統計データを統合し、エリア別の期待利回り・空室リスク・
将来性を Claude が分析する Next.js 15 アプリケーションです。日本の不動産
投資家および AI 資産運用エージェント向けに設計されています。

すべての API エンドポイントは [x402](https://www.x402.org/) プロトコルで
都度課金されます。API キーは不要で、決済は **4 チェーン**（Solana・Base・
Polygon・BNB Chain）に対応します。

### 主な機能

- 日本地図上に主要都市の投資スコアを表示する**利回りヒートマップ**
- 表面/実質利回り・空室リスク・投資スコアの**エリア別分析**
- 利回り・リスク・流動性で最大5エリアを比較する**エリア比較**
- 人口動態・金利見通し・開発計画を踏まえた**将来予測**（1年/3年/5年）
- 主要都市の市況をまとめた約2,000字の**週次マーケットレポート**
- アプリ内チェーンセレクターによる**マルチチェーン決済**
- フォールバック対応：`ANTHROPIC_API_KEY` 未設定時はヒューリスティック分析を
  返し、エンドポイントは常に応答します

### マルチチェーン決済

各エンドポイントはチェーンごとに公開されます。既定の `route.ts` が Base USDC、
その他のチェーンはサブルートとして追加されます。

| チェーン   | トークン     | エンドポイント                          | 実装方式   |
| ---------- | ------------ | --------------------------------------- | ---------- |
| Base       | USDC         | `/api/realestate/{feature}`             | `withX402` |
| Solana     | USDC         | `/api/realestate/{feature}/solana`      | 手動 402   |
| Polygon    | USDC・JPYC   | `/api/realestate/{feature}/polygon`     | `withX402` |
| BNB Chain  | USDT         | `/api/realestate/{feature}/bnb`         | 手動 402   |

`{feature}` は `yield`・`compare`・`forecast`・`weekly` のいずれかです。

- **Polygon の JPYC** — `?token=jpyc` を付与すると USDC ではなく JPYC で決済。
- **Solana** は x402 仕様準拠の手動 402（`network: "solana-mainnet"`、USDC
  `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`）。
- **BNB Chain** も手動 402（`network: "eip155:56"`、USDT
  `0x55d398326f99059fF775485246999027B3197955`）。`x402-next` 1.2.0 の
  `Network` 型に BNB Chain が含まれないためです。
- **Base・Polygon** は `x402-next` の `withX402` でラップしています。

**チェーンセレクター UI**

- 既定チェーン：**Solana**
- Solana → USDC のみ（JPYC タブは表示されるが選択不可）
- Base・Polygon → USDC・JPYC
- BNB Chain → USDT のみ

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

**パラメータ**

- `yield` — `?area=tokyo&type=apartment|house|commercial`
- `compare` — `{ "areas": ["tokyo", "osaka", ...] }`（2〜5エリア）
- `forecast` — `{ "area": "tokyo", "horizon": "1Y"|"3Y"|"5Y" }`
- Polygon のみ — `?token=jpyc` で JPYC 決済

対応エリアキー：`tokyo`・`osaka`・`fukuoka`・`nagoya`・`sapporo`・`kyoto`、
および東京の区 `minato`・`chiyoda`・`shibuya`・`shinjuku`・`setagaya`。

### データソース

- **Japan Data API** — 不動産価格 / 人口統計 / 金利 / GDP（x402 経由）
- **国土交通省** — 不動産取引価格情報 API（無料）
- **e-Stat** — 政府統計 API（無料・`ESTAT_API_KEY` が必要）

ライブデータが取得できない場合（未決済の 402、ネットワークエラー等）は、
内蔵のベースライン指標へフォールバックし、応答を常に返します。

### 技術スタック

- Next.js 15 / React 19
- ルート単位の課金に `x402-next`（`withX402`）＋ Solana / BNB は手動 402
- 分析エンジンに `@anthropic-ai/sdk`（Claude）
- EVM ウォレット（Base / Polygon / BNB）に `wagmi` / `viem` / `@rainbow-me/rainbowkit`
- Solana ウォレット（Phantom / Solflare）に `@solana/wallet-adapter-*`

### セットアップ

```bash
npm install
cp .env.example .env.local   # 値を入力
npm run dev                  # http://localhost:3000
npm run build                # 本番ビルド
```

### 環境変数

| 変数                                    | 説明                                              |
| --------------------------------------- | ------------------------------------------------- |
| `ANTHROPIC_API_KEY`                     | Claude API キー（未設定時はヒューリスティック分析）|
| `WALLET_ADDRESS`                        | EVM 収益受領ウォレット（Base / Polygon / BNB）    |
| `SOLANA_WALLET_ADDRESS`                 | Solana 収益受領ウォレット（base58）               |
| `HELIUS_RPC_URL`                        | Solana RPC エンドポイント（サーバー）             |
| `NEXT_PUBLIC_HELIUS_RPC_URL`            | Solana RPC エンドポイント（クライアント）         |
| `FACILITATOR_URL`                       | x402 ファシリテーターのエンドポイント             |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`  | WalletConnect プロジェクト ID                     |
| `NEXT_PUBLIC_JPYC_CONTRACT`             | JPYC トークンコントラクト（Polygon）              |
| `NEXT_PUBLIC_USDT_BNB_CONTRACT`         | USDT トークンコントラクト（BNB Chain）            |
| `BNB_RPC_URL`                           | BNB Chain RPC エンドポイント                      |
| `ESTAT_API_KEY`                         | e-Stat API キー（無料登録）                       |

### デプロイ

Vercel での運用を想定しています。上記の環境変数をプロジェクト設定に登録し、
デプロイしてください。

### 免責事項

本ツールは情報提供のみを目的としています。不動産投資にはリスクが伴います。
投資判断はご自身でお願いします。
