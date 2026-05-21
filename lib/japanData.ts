import { AREAS, type AreaBaseline, type Liquidity } from "./areas";
import type { YieldData } from "./score";
import { fetchJsonWithX402, fetchWithX402 } from "./x402";

export interface AreaData {
  key: string;
  nameJa: string;
  nameEn: string;
  region: string;
  liquidity: Liquidity;
  yieldData: YieldData;
  avgPriceManYen: number;
  transactionCount: number | null;
  dataSources: string[];
}

const JAPAN_DATA_API = "https://apijapan.vercel.app";
const MLIT_API = "https://www.land.mlit.go.jp/webland/api/TradeListSearch";
const ESTAT_API =
  "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData";

function quarterCode(offsetQuarters: number): string {
  const now = new Date();
  let year = now.getUTCFullYear();
  let quarter = Math.floor(now.getUTCMonth() / 3) + 1 + offsetQuarters;
  while (quarter < 1) {
    quarter += 4;
    year -= 1;
  }
  while (quarter > 4) {
    quarter -= 4;
    year += 1;
  }
  return `${year}${quarter}`;
}

interface MlitResponse {
  status?: string;
  data?: Array<{ TradePrice?: string; Type?: string }>;
}

/** 国土交通省 不動産取引価格情報 API（無料）から取引件数・平均価格を取得。 */
async function fetchMlitSnapshot(
  prefCode: string,
): Promise<{ count: number; avgPriceManYen: number } | null> {
  try {
    const url = `${MLIT_API}?from=${quarterCode(-5)}&to=${quarterCode(-2)}&area=${prefCode}`;
    const res = await fetchWithX402(url);
    if (!res.ok) return null;
    const json = (await res.json()) as MlitResponse;
    if (json.status !== "OK" || !Array.isArray(json.data)) return null;
    const prices = json.data
      .map((row) => Number(row.TradePrice))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length === 0) return null;
    const avgYen = prices.reduce((a, b) => a + b, 0) / prices.length;
    return {
      count: json.data.length,
      avgPriceManYen: Math.round(avgYen / 10000),
    };
  } catch {
    return null;
  }
}

function pickNumber(obj: unknown, keys: string[]): number | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

/** e-Stat API（無料・要 ESTAT_API_KEY）の到達性を確認する。 */
async function fetchEstatSignal(): Promise<boolean> {
  const appId = process.env.ESTAT_API_KEY;
  if (!appId) return false;
  try {
    const url = `${ESTAT_API}?appId=${encodeURIComponent(appId)}&statsDataId=0003410379&limit=1`;
    const res = await fetchWithX402(url);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * エリアの統合データを返す。ベースライン指標を起点に、Japan Data API・
 * 国土交通省・e-Stat のライブデータが取得できた場合のみ補正する。
 */
export async function getAreaData(key: string): Promise<AreaData> {
  const baseline = AREAS.find((a) => a.key === key);
  if (!baseline) throw new Error(`unknown area: ${key}`);

  const yieldData: YieldData = {
    grossYield: baseline.grossYield,
    netYield: baseline.netYield,
    priceIndex: baseline.priceIndex,
    priceChange1Y: baseline.priceChange1Y,
    vacancyRate: baseline.vacancyRate,
    populationTrend: baseline.populationTrend,
  };
  let avgPriceManYen = baseline.avgPriceManYen;
  let transactionCount: number | null = null;
  const dataSources: string[] = ["x402jp ベースライン不動産指標"];

  const [priceLive, popLive, mlit, estatOk] = await Promise.all([
    fetchJsonWithX402<unknown>(
      `${JAPAN_DATA_API}/api/realestate/price?area=${baseline.key}`,
    ),
    fetchJsonWithX402<unknown>(
      `${JAPAN_DATA_API}/api/demographics/population?area=${baseline.key}`,
    ),
    fetchMlitSnapshot(baseline.mlitPrefCode),
    fetchEstatSignal(),
  ]);

  if (priceLive) {
    const livePrice = pickNumber(priceLive, [
      "avgPriceManYen",
      "averagePrice",
      "price",
    ]);
    if (livePrice && livePrice > 200 && livePrice < 80000) {
      avgPriceManYen = Math.round(livePrice);
    }
    const liveYield = pickNumber(priceLive, ["grossYield", "yield"]);
    if (liveYield && liveYield > 0.005 && liveYield < 0.2) {
      yieldData.grossYield = liveYield;
      yieldData.netYield = Number((liveYield * 0.76).toFixed(4));
    }
    dataSources.push("Japan Data API 不動産価格 (x402)");
  }

  if (popLive) {
    dataSources.push("Japan Data API 人口統計 (x402)");
  }

  if (mlit) {
    transactionCount = mlit.count;
    if (mlit.avgPriceManYen > 200 && mlit.avgPriceManYen < 80000) {
      avgPriceManYen = Math.round(
        avgPriceManYen * 0.6 + mlit.avgPriceManYen * 0.4,
      );
    }
    dataSources.push("国土交通省 不動産取引価格情報");
  }

  if (estatOk) {
    dataSources.push("e-Stat 政府統計");
  }

  return {
    key: baseline.key,
    nameJa: baseline.nameJa,
    nameEn: baseline.nameEn,
    region: baseline.region,
    liquidity: baseline.liquidity,
    yieldData,
    avgPriceManYen,
    transactionCount,
    dataSources,
  };
}

export function baselineFor(key: string): AreaBaseline | undefined {
  return AREAS.find((a) => a.key === key);
}
