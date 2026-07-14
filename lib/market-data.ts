import type { InvestmentType } from "@/types";

export interface MarketInstrument {
  symbol: string;
  name: string;
  type: InvestmentType;
  price: number;
}

export const marketInstruments: MarketInstrument[] = [
  { symbol: "NXR500", name: "Novaofficial 500 Index Fund", type: "mutual_fund", price: 128.4 },
  { symbol: "NXRBAL", name: "Novaofficial Balanced Growth Fund", type: "mutual_fund", price: 64.12 },
  { symbol: "NXTECH", name: "Novaofficial Technology Corp.", type: "stock", price: 342.5 },
  { symbol: "NXENR", name: "Novaofficial Energy Holdings", type: "stock", price: 87.25 },
  { symbol: "NXRETL", name: "Novaofficial Retail Group", type: "stock", price: 54.8 },
  { symbol: "BTC", name: "Bitcoin (demo)", type: "crypto", price: 61250.0 },
  { symbol: "ETH", name: "Ethereum (demo)", type: "crypto", price: 3380.5 },
];

export function generatePerformanceSeries(basePrice: number, points = 12) {
  const series = [];
  let price = basePrice * 0.85;

  for (let i = 0; i < points; i++) {
    price *= 1 + (Math.random() - 0.42) * 0.06;
    series.push({
      month: new Date(Date.now() - (points - i) * 30 * 86400000).toLocaleDateString("en-US", {
        month: "short",
      }),
      value: Number(price.toFixed(2)),
    });
  }

  return series;
}
