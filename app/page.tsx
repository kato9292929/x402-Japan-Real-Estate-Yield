import { mapAreas } from "@/lib/areas";
import { heuristicScore, scoreColor } from "@/lib/score";
import { WalletButton } from "@/components/WalletButton";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { PaymentExplorer } from "@/components/PaymentExplorer";

const pct = (n: number, digits = 1): string =>
  `${(n * 100).toFixed(digits)}%`;

const PRICING = [
  {
    tier: "エリア分析",
    amount: "$0.30",
    desc: "単一エリアの表面/実質利回り・空室リスク・投資スコアを Claude が総合分析。",
    endpoint: "GET /api/realestate/yield",
  },
  {
    tier: "エリア比較",
    amount: "$0.50",
    desc: "最大5エリアの利回り・リスク・流動性を横断比較しランキング化。",
    endpoint: "POST /api/realestate/compare",
  },
  {
    tier: "将来予測",
    amount: "$1.00",
    desc: "人口動態・金利見通し・開発計画を踏まえた 1〜5年先の利回り予測。",
    endpoint: "POST /api/realestate/forecast",
  },
  {
    tier: "週次レポート",
    amount: "$2.00",
    desc: "主要都市の市況をまとめた約2,000字の週次マーケットレポート。",
    endpoint: "GET /api/realestate/weekly",
  },
];

const API_ROWS = [
  {
    method: "GET",
    path: "/api/realestate/yield?area=tokyo&type=apartment",
    price: "$0.30",
  },
  { method: "POST", path: "/api/realestate/compare", price: "$0.50" },
  { method: "POST", path: "/api/realestate/forecast", price: "$1.00" },
  { method: "GET", path: "/api/realestate/weekly", price: "$2.00" },
];

const CHAIN_ROWS = [
  { chain: "Base", token: "USDC", suffix: "（既定 / route.ts）" },
  { chain: "Solana", token: "USDC", suffix: "/solana" },
  { chain: "Polygon", token: "USDC · JPYC", suffix: "/polygon" },
  { chain: "BNB Chain", token: "USDT", suffix: "/bnb" },
];

export default function Home() {
  const areas = mapAreas();

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <div className="brand">
            <span className="brand-badge">x402</span>
            <span className="brand-name">REAL ESTATE YIELD</span>
          </div>
          <div className="header-wallets">
            <SolanaWalletButton />
            <WalletButton />
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="hero-eyebrow">Japan Real Estate Intelligence</p>
            <h1>JAPAN REAL ESTATE YIELD</h1>
            <p className="hero-sub">
              AIが日本の不動産投資利回りをエリア別に分析する。
            </p>
            <p className="hero-note">
              Japan Data API・国土交通省・e-Stat の不動産/金利/人口統計データを
              統合し、エリア別の期待利回り・空室リスク・将来性を Claude が分析。
              不動産投資家と AI 資産運用エージェントのためのデータ API です。
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="v">6+</div>
                <div className="l">分析対象エリア</div>
              </div>
              <div className="hero-stat">
                <div className="v">4</div>
                <div className="l">対応決済チェーン</div>
              </div>
              <div className="hero-stat">
                <div className="v">Claude</div>
                <div className="l">利回り分析エンジン</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="map">
          <div className="wrap">
            <div className="section-head">
              <span className="section-kicker">Yield Heatmap</span>
              <h2 className="section-title">不動産利回りヒートマップ</h2>
              <p className="section-desc">
                日本地図上に主要都市の投資スコアをヒートマップ表示。
                色が明るいほど総合投資スコアが高いエリアです。
              </p>
            </div>

            <div className="map-panel">
              <svg
                className="map-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#26221a" />
                    <stop offset="100%" stopColor="#16140f" />
                  </linearGradient>
                </defs>
                <path
                  d="M 70 4 C 82 0 92 6 90 16 C 88 24 76 24 70 16 C 66 10 66 6 70 4 Z"
                  fill="url(#land)"
                  stroke="#3a342a"
                  strokeWidth="0.4"
                />
                <path
                  d="M 78 26 C 86 32 82 44 74 52 C 66 60 54 64 42 64 C 36 64 38 58 46 56 C 56 53 64 48 68 40 C 71 33 73 28 78 26 Z"
                  fill="url(#land)"
                  stroke="#3a342a"
                  strokeWidth="0.4"
                />
                <path
                  d="M 34 64 C 44 63 48 67 44 71 C 38 73 32 70 34 64 Z"
                  fill="url(#land)"
                  stroke="#3a342a"
                  strokeWidth="0.4"
                />
                <path
                  d="M 8 64 C 20 60 28 66 26 76 C 24 86 12 86 8 78 C 4 72 4 68 8 64 Z"
                  fill="url(#land)"
                  stroke="#3a342a"
                  strokeWidth="0.4"
                />
              </svg>

              {areas.map((area) => {
                const { score } = heuristicScore(area);
                const color = scoreColor(score);
                const size = 14 + score * 26;
                return (
                  <div
                    key={area.key}
                    className="map-marker"
                    style={{ left: `${area.mapX}%`, top: `${area.mapY}%` }}
                  >
                    <span
                      className="map-dot"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        background: color,
                        boxShadow: `0 0 ${size}px ${color}, 0 0 ${size / 2}px ${color}`,
                      }}
                    />
                    <span className="map-label">{area.nameJa}</span>
                    <span className="map-yield">{pct(area.grossYield)}</span>
                  </div>
                );
              })}

              <div className="map-legend">
                <span>
                  <i
                    className="legend-swatch"
                    style={{ background: "#d8b878" }}
                  />
                  スコア高
                </span>
                <span>
                  <i
                    className="legend-swatch"
                    style={{ background: "#8f7d54" }}
                  />
                  中
                </span>
                <span>
                  <i
                    className="legend-swatch"
                    style={{ background: "#5d553f" }}
                  />
                  低
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="areas">
          <div className="wrap">
            <div className="section-head">
              <span className="section-kicker">Area Coverage</span>
              <h2 className="section-title">エリア別利回りサマリー</h2>
              <p className="section-desc">
                決済ネットワーク（Solana / Base / Polygon / BNB Chain）を選択し、
                各エリアの「詳細分析」から x402 課金（$0.30）で Claude による
                総合利回り分析レポートを取得できます。
              </p>
            </div>

            <PaymentExplorer />
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="wrap">
            <div className="section-head">
              <span className="section-kicker">Pricing</span>
              <h2 className="section-title">料金プラン</h2>
              <p className="section-desc">
                すべての API は x402 プロトコルで都度課金。APIキー不要、
                リクエスト単位で支払います。
              </p>
            </div>

            <div className="pricing-grid">
              {PRICING.map((p) => (
                <div key={p.tier} className="price-card">
                  <span className="tier">{p.tier}</span>
                  <span className="amount">{p.amount}</span>
                  <span className="pdesc">{p.desc}</span>
                  <span className="endpoint">{p.endpoint}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="chains">
          <div className="wrap">
            <div className="section-head">
              <span className="section-kicker">Multi-chain Payment</span>
              <h2 className="section-title">対応決済チェーン</h2>
              <p className="section-desc">
                各エンドポイントにチェーン別サブルートを用意。Base は既定の
                route.ts、その他は /solana・/polygon・/bnb で課金します。
              </p>
            </div>

            <div className="api-list">
              {CHAIN_ROWS.map((row) => (
                <div key={row.chain} className="api-row">
                  <span className="api-method">{row.chain}</span>
                  <span className="api-path">{row.token}</span>
                  <span className="api-price">{row.suffix}</span>
                </div>
              ))}
              <p className="api-note">
                Solana・BNB Chain は手動 402（x402 仕様準拠）、Base・Polygon は
                x402-next の withX402 で実装。Polygon は ?token=jpyc で JPYC 決済に
                対応します。
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="api">
          <div className="wrap">
            <div className="section-head">
              <span className="section-kicker">API</span>
              <h2 className="section-title">エンドポイント</h2>
              <p className="section-desc">
                AI 資産運用エージェントは x402 対応クライアントから直接
                呼び出せます。402 応答に対し決済を添えて再リクエストします。
              </p>
            </div>

            <div className="api-list">
              {API_ROWS.map((row) => (
                <div key={row.path} className="api-row">
                  <span
                    className={`api-method ${row.method === "POST" ? "post" : ""}`}
                  >
                    {row.method}
                  </span>
                  <span className="api-path">{row.path}</span>
                  <span className="api-price">{row.price}</span>
                </div>
              ))}
              <p className="api-note">
                データソース: Japan Data API（x402）/ 国土交通省 不動産取引価格
                情報 API / e-Stat 政府統計。分析エンジンは Claude。
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <div className="disclaimer">
            <strong>免責事項：</strong>
            本ツールは情報提供のみを目的としています。不動産投資にはリスクが
            伴います。投資判断はご自身でお願いします。
          </div>
          <div className="data-tags">
            <span className="data-tag">Japan Data API</span>
            <span className="data-tag">国土交通省 不動産価格指数</span>
            <span className="data-tag">e-Stat 政府統計</span>
            <span className="data-tag">Claude AI 分析</span>
            <span className="data-tag">x402 マルチチェーン決済</span>
          </div>
          <div className="footer-meta">
            <span>x402 JAPAN REAL ESTATE YIELD</span>
            <span>Powered by Japan Data API &amp; Claude</span>
          </div>
        </div>
      </footer>
    </>
  );
}
