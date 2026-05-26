"use client";

import { useCallback, useEffect, useState } from "react";
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

interface PaymentRequired402 {
  x402Version?: number;
  accepts?: PaymentAccept[];
}

interface AnalysisPanelProps {
  area: AreaBaseline;
  chain: ChainKey;
  token: TokenKey;
  onClose: () => void;
}

type Status = "loading" | "result" | "payment" | "error";

const EVM_CHAINS: ChainKey[] = ["base", "polygon"];

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
  const [body402, setBody402] = useState<PaymentRequired402 | null>(null);
  const [error, setError] = useState<string>("");

  const chainLabel = chainByKey(chain).label;
  const endpoint = yieldEndpoint(chain, token, area.key);
  const isEvm = EVM_CHAINS.includes(chain);

  const probe = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(endpoint, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        setResult((await res.json()) as AnalysisResult);
        setStatus("result");
        return;
      }
      if (res.status === 402) {
        const json = (await res.json().catch(() => null)) as
          | PaymentRequired402
          | null;
        setBody402(json);
        setStatus("payment");
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setError(errMsg(e));
      setStatus("error");
    }
  }, [endpoint]);

  useEffect(() => {
    void probe();
  }, [probe]);

  const accepts = body402?.accepts ?? [];

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

      {status === "payment" ? (
        <div className="ap-pay">
          <p className="ap-pay-head">
            x402 決済が必要です
            {body402?.x402Version ? ` ・ v${body402.x402Version}` : null}
          </p>

          {accepts.length === 0 ? (
            <p className="ap-muted">決済要件の取得に失敗しました。</p>
          ) : (
            <ul className="ap-accepts">
              {accepts.map((a, i) => (
                <li key={i}>
                  <dl className="ap-pay-grid">
                    <div>
                      <dt>ネットワーク</dt>
                      <dd>{a.network ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>金額（base units）</dt>
                      <dd>{a.maxAmountRequired ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>アセット</dt>
                      <dd>{a.asset ? truncate(a.asset) : "-"}</dd>
                    </div>
                    <div>
                      <dt>送金先</dt>
                      <dd>{a.payTo ? truncate(a.payTo) : "未設定"}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}

          {isEvm ? (
            <a
              className="ap-btn primary"
              href={endpoint}
              target="_blank"
              rel="noopener noreferrer"
            >
              {chainLabel} ペイウォールを開いて決済する
            </a>
          ) : (
            <p className="ap-muted">
              {chainLabel} は手動 402 フローです。x402 対応クライアントから
              X-PAYMENT を付与して再送するか、ファシリテーター経由で決済して
              ください。
            </p>
          )}
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
