"use client";

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  internal: { label: "Internal", color: "var(--color-chart-1)" },
  bank: { label: "Bank", color: "var(--color-chart-2)" },
  international: { label: "International", color: "var(--color-chart-5)" },
};

export function TransferVolumeChart({
  data,
}: {
  data: { month: string; internal: number; bank: number; international: number }[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Bar dataKey="internal" stackId="a" fill="var(--color-chart-1)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="bank" stackId="a" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="international" stackId="a" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
