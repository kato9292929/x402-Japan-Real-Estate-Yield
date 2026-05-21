"use client";

import {
  PAYMENT_CHAINS,
  TOKEN_LABEL,
  chainByKey,
  type ChainKey,
  type TokenKey,
} from "@/lib/paymentChains";

interface ChainSelectorProps {
  chain: ChainKey;
  token: TokenKey;
  onChainChange: (chain: ChainKey) => void;
  onTokenChange: (token: TokenKey) => void;
}

export function ChainSelector({
  chain,
  token,
  onChainChange,
  onTokenChange,
}: ChainSelectorProps) {
  const active = chainByKey(chain);

  return (
    <div className="chain-selector">
      <div className="cs-row">
        <span className="cs-label">決済ネットワーク</span>
        <div className="cs-chains">
          {PAYMENT_CHAINS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`cs-chain${c.key === chain ? " active" : ""}`}
              onClick={() => onChainChange(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cs-row">
        <span className="cs-label">決済トークン</span>
        <div className="cs-tokens">
          {active.tokens.map((t) => (
            <button
              key={t}
              type="button"
              className={`cs-token${t === token ? " active" : ""}`}
              onClick={() => onTokenChange(t)}
            >
              {TOKEN_LABEL[t]}
            </button>
          ))}
          {active.disabledTokens.map((t) => (
            <button
              key={t}
              type="button"
              className="cs-token disabled"
              disabled
              aria-disabled="true"
            >
              {TOKEN_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {active.banner ? (
        <p className="cs-banner">{active.banner}</p>
      ) : null}
    </div>
  );
}
