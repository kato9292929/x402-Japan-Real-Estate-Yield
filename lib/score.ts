import type { PopulationTrend } from "./areas";

export interface YieldData {
  grossYield: number;
  netYield: number;
  priceIndex: number;
  priceChange1Y: number;
  vacancyRate: number;
  populationTrend: PopulationTrend;
}

export type Recommendation = "ACCUMULATE" | "HOLD" | "NEUTRAL" | "CAUTION";

export const clamp = (n: number, lo = 0, hi = 1): number =>
  Math.max(lo, Math.min(hi, n));

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Claude が利用できない場合のフォールバック投資スコア。
 * 利回り・価格モメンタム・空室率・人口動態の加重平均。
 */
export function heuristicScore(y: YieldData): {
  score: number;
  recommendation: Recommendation;
} {
  const yieldScore = clamp((y.grossYield - 0.03) / 0.04);
  const growthScore = clamp((y.priceChange1Y + 0.02) / 0.12);
  const vacancyScore = clamp((0.08 - y.vacancyRate) / 0.06);
  const popScore =
    y.populationTrend === "GROWING"
      ? 1
      : y.populationTrend === "STABLE"
        ? 0.55
        : 0.2;
  const score = round2(
    clamp(
      0.3 * yieldScore +
        0.25 * growthScore +
        0.2 * vacancyScore +
        0.25 * popScore,
    ),
  );
  return { score, recommendation: toRecommendation(score) };
}

export function toRecommendation(score: number): Recommendation {
  if (score >= 0.7) return "ACCUMULATE";
  if (score >= 0.55) return "HOLD";
  if (score >= 0.4) return "NEUTRAL";
  return "CAUTION";
}

/** 投資スコアからヒートマップ色を決定する。 */
export function scoreColor(score: number): string {
  if (score >= 0.7) return "#d8b878";
  if (score >= 0.55) return "#c8a96e";
  if (score >= 0.4) return "#8f7d54";
  return "#5d553f";
}

export function recommendationJa(rec: Recommendation): string {
  switch (rec) {
    case "ACCUMULATE":
      return "積極取得";
    case "HOLD":
      return "保有妥当";
    case "NEUTRAL":
      return "中立";
    case "CAUTION":
      return "慎重";
  }
}
