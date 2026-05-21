"use client";

import { useState } from "react";
import { mapAreas, type AreaBaseline } from "@/lib/areas";
import { heuristicScore, recommendationJa, scoreColor } from "@/lib/score";
import {
  DEFAULT_CHAIN,
  TOKEN_LABEL,
  chainByKey,
  type ChainKey,
  type TokenKey,
} from "@/lib/paymentChains";
import { ChainSelector } from "@/components/ChainSelector";
import { AnalysisPanel } from "@/components/AnalysisPanel";

const pct = (n: number, digits = 1): string =>
  `${(n * 100).toFixed(digits)}%`;

const signedPct = (n: number): string =>
  `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

const trendJa: Record<AreaBaseline["populationTrend"], string> = {
  GROWING: "増加",
  STABLE: "横ばい",
  DECLINING: "減少",
};

export function PaymentExplorer() {
  const areas = mapAreas();
  const [chain, setChain] = useState<ChainKey>(DEFAULT_CHAIN);
  const [token, setToken] = useState<TokenKey>(
    chainByKey(DEFAULT_CHAIN).tokens[0],
  );
  const [selected, setSelected] = useState<AreaBaseline | null>(null);

  function handleChainChange(next: ChainKey) {
    setChain(next);
    setToken(chainByKey(next).tokens[0]);
  }

  const active = chainByKey(chain);
  const previewPath = `/api/realestate/yield${active.routeSuffix}`;

  return (
    <div className="payment-explorer">
      <ChainSelector
        chain={chain}
        token={token}
        onChainChange={handleChainChange}
        onTokenChange={setToken}
      />

      <p className="cs-endpoint">
        選択中: <strong>{active.label}</strong> ・{" "}
        <strong>{TOKEN_LABEL[token]}</strong> →{" "}
        <code>{previewPath}</code>
      </p>

      <div className="area-grid">
        {areas.map((area) => {
          const { score, recommendation } = heuristicScore(area);
          const color = scoreColor(score);
          const isSelected = selected?.key === area.key;
          return (
            <article
              key={area.key}
              className={`area-card${isSelected ? " selected" : ""}`}
            >
              <div className="area-card-top">
                <div>
                  <div className="area-name">{area.nameJa}</div>
                  <div className="area-name-en">{area.nameEn}</div>
                </div>
                <span className="area-region">{area.region}</span>
              </div>

              <div className="area-yield">
                <span className="big">{pct(area.grossYield)}</span>
                <span className="cap">表面利回り</span>
              </div>

              <div className="area-metrics">
                <div className="metric">
                  <div className="m-label">空室率</div>
                  <div className="m-value">{pct(area.vacancyRate)}</div>
                </div>
                <div className="metric">
                  <div className="m-label">価格変動 1Y</div>
                  <div
                    className={`m-value ${area.priceChange1Y >= 0 ? "pos" : "neg"}`}
                  >
                    {signedPct(area.priceChange1Y)}
                  </div>
                </div>
                <div className="metric">
                  <div className="m-label">投資スコア</div>
                  <div className="m-value" style={{ color }}>
                    {score.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="score-bar">
                <i style={{ width: `${score * 100}%`, background: color }} />
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: "0.74rem",
                  color: "var(--muted)",
                }}
              >
                人口動態: {trendJa[area.populationTrend]} ・ 判断:{" "}
                {recommendationJa(recommendation)}
              </div>

              <button
                type="button"
                className="area-cta"
                onClick={() => setSelected(isSelected ? null : area)}
              >
                <span>{isSelected ? "分析を閉じる" : "詳細分析"} ・ {active.label}</span>
                <span className="price">$0.30</span>
              </button>
            </article>
          );
        })}
      </div>

      {selected ? (
        <AnalysisPanel
          key={`${selected.key}-${chain}-${token}`}
          area={selected}
          chain={chain}
          token={token}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
