"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { generatePerformanceSeries } from "@/lib/market-data";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  value: { label: "Portfolio value", color: "var(--color-chart-1)" },
};

export function PerformanceChart({ basePrice }: { basePrice: number }) {
  const data = React.useMemo(() => generatePerformanceSeries(basePrice || 100), [basePrice]);

  return (
    <ChartContainer config={chartConfig} className="h-56 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="value"
          type="monotone"
          fill="url(#fillValue)"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
