export type PopulationTrend = "GROWING" | "STABLE" | "DECLINING";
export type PropertyType = "apartment" | "house" | "commercial";
export type Liquidity = "HIGH" | "MEDIUM" | "LOW";

export interface AreaBaseline {
  key: string;
  nameJa: string;
  nameEn: string;
  region: string;
  /** 国土交通省 不動産価格 API の都道府県コード */
  mlitPrefCode: string;
  grossYield: number;
  netYield: number;
  priceIndex: number;
  priceChange1Y: number;
  vacancyRate: number;
  populationTrend: PopulationTrend;
  avgPriceManYen: number;
  liquidity: Liquidity;
  /** ランディングの日本地図ヒートマップに表示するか */
  onMap: boolean;
  mapX: number;
  mapY: number;
  highlights: string[];
}

/**
 * エリア別ベースライン指標。Japan Data API / 国土交通省 / e-Stat の
 * ライブデータが取得できない場合のフォールバックとしても利用する。
 */
export const AREAS: AreaBaseline[] = [
  {
    key: "tokyo",
    nameJa: "東京23区",
    nameEn: "Tokyo 23 Wards",
    region: "関東",
    mlitPrefCode: "13",
    grossYield: 0.038,
    netYield: 0.029,
    priceIndex: 1.28,
    priceChange1Y: 0.085,
    vacancyRate: 0.032,
    populationTrend: "GROWING",
    avgPriceManYen: 7200,
    liquidity: "HIGH",
    onMap: true,
    mapX: 71,
    mapY: 53,
    highlights: ["再開発集積", "インバウンド需要"],
  },
  {
    key: "osaka",
    nameJa: "大阪市",
    nameEn: "Osaka City",
    region: "近畿",
    mlitPrefCode: "27",
    grossYield: 0.046,
    netYield: 0.036,
    priceIndex: 1.15,
    priceChange1Y: 0.061,
    vacancyRate: 0.041,
    populationTrend: "GROWING",
    avgPriceManYen: 3850,
    liquidity: "HIGH",
    onMap: true,
    mapX: 45,
    mapY: 60,
    highlights: ["万博跡地開発", "観光回復"],
  },
  {
    key: "fukuoka",
    nameJa: "福岡市",
    nameEn: "Fukuoka City",
    region: "九州",
    mlitPrefCode: "40",
    grossYield: 0.051,
    netYield: 0.04,
    priceIndex: 1.19,
    priceChange1Y: 0.073,
    vacancyRate: 0.045,
    populationTrend: "GROWING",
    avgPriceManYen: 3100,
    liquidity: "MEDIUM",
    onMap: true,
    mapX: 17,
    mapY: 72,
    highlights: ["人口流入", "天神ビッグバン"],
  },
  {
    key: "nagoya",
    nameJa: "名古屋市",
    nameEn: "Nagoya City",
    region: "中部",
    mlitPrefCode: "23",
    grossYield: 0.048,
    netYield: 0.038,
    priceIndex: 1.08,
    priceChange1Y: 0.032,
    vacancyRate: 0.05,
    populationTrend: "STABLE",
    avgPriceManYen: 3400,
    liquidity: "MEDIUM",
    onMap: true,
    mapX: 56,
    mapY: 58,
    highlights: ["リニア開業期待", "製造業基盤"],
  },
  {
    key: "sapporo",
    nameJa: "札幌市",
    nameEn: "Sapporo City",
    region: "北海道",
    mlitPrefCode: "01",
    grossYield: 0.054,
    netYield: 0.042,
    priceIndex: 1.06,
    priceChange1Y: 0.028,
    vacancyRate: 0.062,
    populationTrend: "STABLE",
    avgPriceManYen: 2600,
    liquidity: "MEDIUM",
    onMap: true,
    mapX: 79,
    mapY: 13,
    highlights: ["高利回り", "観光・半導体投資"],
  },
  {
    key: "kyoto",
    nameJa: "京都市",
    nameEn: "Kyoto City",
    region: "近畿",
    mlitPrefCode: "26",
    grossYield: 0.044,
    netYield: 0.034,
    priceIndex: 1.12,
    priceChange1Y: 0.046,
    vacancyRate: 0.04,
    populationTrend: "STABLE",
    avgPriceManYen: 3700,
    liquidity: "MEDIUM",
    onMap: true,
    mapX: 48,
    mapY: 56,
    highlights: ["観光需要", "供給制約"],
  },
  {
    key: "minato",
    nameJa: "港区",
    nameEn: "Minato Ward",
    region: "東京都",
    mlitPrefCode: "13",
    grossYield: 0.042,
    netYield: 0.031,
    priceIndex: 1.24,
    priceChange1Y: 0.087,
    vacancyRate: 0.032,
    populationTrend: "GROWING",
    avgPriceManYen: 12400,
    liquidity: "HIGH",
    onMap: false,
    mapX: 71,
    mapY: 53,
    highlights: ["再開発計画", "高額賃料"],
  },
  {
    key: "chiyoda",
    nameJa: "千代田区",
    nameEn: "Chiyoda Ward",
    region: "東京都",
    mlitPrefCode: "13",
    grossYield: 0.037,
    netYield: 0.028,
    priceIndex: 1.31,
    priceChange1Y: 0.091,
    vacancyRate: 0.029,
    populationTrend: "GROWING",
    avgPriceManYen: 13900,
    liquidity: "HIGH",
    onMap: false,
    mapX: 71,
    mapY: 53,
    highlights: ["オフィス需要", "希少性"],
  },
  {
    key: "shibuya",
    nameJa: "渋谷区",
    nameEn: "Shibuya Ward",
    region: "東京都",
    mlitPrefCode: "13",
    grossYield: 0.039,
    netYield: 0.03,
    priceIndex: 1.27,
    priceChange1Y: 0.094,
    vacancyRate: 0.031,
    populationTrend: "GROWING",
    avgPriceManYen: 11200,
    liquidity: "HIGH",
    onMap: false,
    mapX: 71,
    mapY: 53,
    highlights: ["IT企業集積", "再開発"],
  },
  {
    key: "shinjuku",
    nameJa: "新宿区",
    nameEn: "Shinjuku Ward",
    region: "東京都",
    mlitPrefCode: "13",
    grossYield: 0.043,
    netYield: 0.033,
    priceIndex: 1.21,
    priceChange1Y: 0.078,
    vacancyRate: 0.038,
    populationTrend: "GROWING",
    avgPriceManYen: 8600,
    liquidity: "HIGH",
    onMap: false,
    mapX: 71,
    mapY: 53,
    highlights: ["交通結節点", "賃貸需要厚い"],
  },
  {
    key: "setagaya",
    nameJa: "世田谷区",
    nameEn: "Setagaya Ward",
    region: "東京都",
    mlitPrefCode: "13",
    grossYield: 0.041,
    netYield: 0.032,
    priceIndex: 1.18,
    priceChange1Y: 0.062,
    vacancyRate: 0.036,
    populationTrend: "STABLE",
    avgPriceManYen: 7800,
    liquidity: "MEDIUM",
    onMap: false,
    mapX: 71,
    mapY: 53,
    highlights: ["居住人気", "安定需要"],
  },
];

const ALIASES: Record<string, string> = {
  tokyo23: "tokyo",
  "tokyo-23": "tokyo",
  東京: "tokyo",
  東京23区: "tokyo",
  大阪: "osaka",
  大阪市: "osaka",
  福岡: "fukuoka",
  福岡市: "fukuoka",
  名古屋: "nagoya",
  名古屋市: "nagoya",
  札幌: "sapporo",
  札幌市: "sapporo",
  京都: "kyoto",
  京都市: "kyoto",
  港区: "minato",
  千代田区: "chiyoda",
  渋谷区: "shibuya",
  新宿区: "shinjuku",
  世田谷区: "setagaya",
};

export function resolveArea(input: string): AreaBaseline | null {
  if (!input) return null;
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const key = ALIASES[raw] ?? ALIASES[lower] ?? lower;
  return AREAS.find((a) => a.key === key) ?? null;
}

export function mapAreas(): AreaBaseline[] {
  return AREAS.filter((a) => a.onMap);
}
