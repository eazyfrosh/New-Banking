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
  deposits: { label: "Deposits", color: "var(--color-chart-2)" },
  withdrawals: { label: "Withdrawals", color: "var(--color-chart-4)" },
};

export function DepositsWithdrawalsChart({
  data,
}: {
  data: { month: string; deposits: number; withdrawals: number }[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Bar dataKey="deposits" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="withdrawals" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
