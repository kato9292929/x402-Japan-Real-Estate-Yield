"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import { publicActions } from "viem";
import { wrapFetchWithPayment } from "x402-fetch";
import type { AreaBaseline } from "@/lib/areas";
import {
  chainByKey,
  yieldEndpoint,
  type ChainKey,
  type TokenKey,
} from "@/lib/paymentChains";

interface AnalysisResult {
  area: string;
  analyzedAt: string;
  yieldData: {
    grossYield: number;
    netYield: number;
    priceChange1Y: number;
    vacancyRate: number;
    populationTrend: string;
  };
  analysis: {
    investmentScore: number;
    recommendation: string;
    keyRisks: string[];
    keyOpportunities: string[];
    analysis_ja: string;
    confidence: number;
  };
  analysisSource?: string;
}

interface PaymentAccept {
  scheme?: string;
  network?: string;
  maxAmountRequired?: string;
  description?: string;
  payTo?: string;
  asset?: string;
}

interface AnalysisPanelProps {
  area: AreaBaseline;
  chain: ChainKey;
  token: TokenKey;
  onClose: () => void;
}

type Status = "loading" | "result" | "payment" | "error";

const EVM_CHAIN_ID: Partial<Record<ChainKey, number>> = {
  base: 8453,
  polygon: 137,
};

const RECOMMENDATION_JA: Record<string, string> = {
  ACCUMULATE: "積極取得",
  HOLD: "保有妥当",
  NEUTRAL: "中立",
  CAUTION: "慎重",
};

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const truncate = (s: string): string =>
  s.length > 16 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s;
const errMsg = (e: unknown): string =>
  e instanceof Error ? e.message : "処理に失敗しました";

export function AnalysisPanel({
  area,
  chain,
  token,
  onClose,
}: AnalysisPanelProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [accept, setAccept] = useState<PaymentAccept | null>(null);
  const [error, setError] = useState<string>("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string>("");

  const evmChainId = EVM_CHAIN_ID[chain];
  const isEvm = evmChainId !== undefined;
  const { isConnected, chainId: activeChainId } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: evmChainId });
  const { switchChainAsync } = useSwitchChain();

  const chainLabel = chainByKey(chain).label;

  const probe = useCallback(async () => {
    setStatus("loading");
    setError("");
    setPayError("");
    try {
      const res = await fetch(yieldEndpoint(chain, token, area.key), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        setResult((await res.json()) as AnalysisResult);
        setStatus("result");
        return;
      }
      if (res.status === 402) {
        const body = (await res.json().catch(() => null)) as {
          accepts?: PaymentAccept[];
        } | null;
        setAccept(body?.accepts?.[0] ?? null);
        setStatus("payment");
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setError(errMsg(e));
      setStatus("error");
    }
  }, [area.key, chain, token]);

  useEffect(() => {
    void probe();
  }, [probe]);

  async function payWithEvmWallet() {
    if (!walletClient || evmChainId === undefined) return;
    setPaying(true);
    setPayError("");
    try {
      if (activeChainId !== evmChainId) {
        await switchChainAsync({ chainId: evmChainId });
      }
      const signer = walletClient.extend(publicActions);
      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        signer as Parameters<typeof wrapFetchWithPayment>[1],
        BigInt(10000000),
      );
      const res = await fetchWithPayment(
        yieldEndpoint(chain, token, area.key),
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error(`決済後の応答エラー HTTP ${res.status}`);
      setResult((await res.json()) as AnalysisResult);
      setStatus("result");
    } catch (e) {
      setPayError(errMsg(e));
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="analysis-panel">
      <div className="ap-head">
        <div>
          <span className="ap-kicker">エリア分析 ・ {chainLabel}</span>
          <h3 className="ap-title">{area.nameJa}</h3>
        </div>
        <button type="button" className="ap-close" onClick={onClose}>
          閉じる
        </button>
      </div>

      {status === "loading" ? (
        <p className="ap-muted">分析データを取得しています…</p>
      ) : null}

      {status === "error" ? (
        <div className="ap-error">
          <p>取得に失敗しました: {error}</p>
          <button type="button" className="ap-btn" onClick={() => probe()}>
            再試行
          </button>
        </div>
      ) : null}

      {status === "payment" && accept ? (
        <div className="ap-pay">
          <p className="ap-pay-head">x402 決済が必要です ・ $0.30</p>
          <dl className="ap-pay-grid">
            <div>
              <dt>ネットワーク</dt>
              <dd>{accept.network ?? "-"}</dd>
            </div>
            <div>
              <dt>金額（base units）</dt>
              <dd>{accept.maxAmountRequired ?? "-"}</dd>
            </div>
            <div>
              <dt>アセット</dt>
              <dd>{accept.asset ? truncate(accept.asset) : "-"}</dd>
            </div>
            <div>
              <dt>送金先</dt>
              <dd>{accept.payTo ? truncate(accept.payTo) : "未設定"}</dd>
            </div>
          </dl>

          {isEvm ? (
            isConnected ? (
              <button
                type="button"
                className="ap-btn primary"
                onClick={() => payWithEvmWallet()}
                disabled={paying}
              >
                {paying
                  ? "決済処理中…"
                  : `${chainLabel} ウォレットで決済して分析`}
              </button>
            ) : (
              <p className="ap-muted">
                右上の「ウォレット接続」から {chainLabel} 対応ウォレットを
                接続すると、ブラウザから x402 決済を実行できます。
              </p>
            )
          ) : (
            <p className="ap-muted">
              {chainLabel} は手動 402 フローです。x402 対応クライアント
              （または接続済みウォレット）で X-PAYMENT を付与して再送して
              ください。決済の確定にはファシリテーター設定が必要です。
            </p>
          )}

          {payError ? <p className="ap-payerr">決済エラー: {payError}</p> : null}
        </div>
      ) : null}

      {status === "result" && result ? (
        <div className="ap-result">
          <div className="ap-score-row">
            <div className="ap-score">
              <span className="ap-score-v">
                {result.analysis.investmentScore.toFixed(2)}
              </span>
              <span className="ap-score-l">投資スコア</span>
            </div>
            <div className="ap-rec">
              {RECOMMENDATION_JA[result.analysis.recommendation] ??
                result.analysis.recommendation}
            </div>
            <div className="ap-conf">
              確度 {pct(result.analysis.confidence)}
            </div>
          </div>

          <p className="ap-analysis">{result.analysis.analysis_ja}</p>

          <div className="ap-metrics">
            <div>
              <span className="apm-l">表面利回り</span>
              <span className="apm-v">{pct(result.yieldData.grossYield)}</span>
            </div>
            <div>
              <span className="apm-l">実質利回り</span>
              <span className="apm-v">{pct(result.yieldData.netYield)}</span>
            </div>
            <div>
              <span className="apm-l">空室率</span>
              <span className="apm-v">{pct(result.yieldData.vacancyRate)}</span>
            </div>
          </div>

          <div className="ap-lists">
            <div>
              <span className="apl-h">主なリスク</span>
              <ul>
                {result.analysis.keyRisks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="apl-h">主な機会</span>
              <ul>
                {result.analysis.keyOpportunities.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          </div>

          {result.analysisSource ? (
            <p className="ap-muted">
              分析ソース:{" "}
              {result.analysisSource === "claude"
                ? "Claude"
                : "ヒューリスティック（APIキー未設定時のフォールバック）"}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
