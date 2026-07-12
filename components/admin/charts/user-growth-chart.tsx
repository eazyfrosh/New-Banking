"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  users: { label: "Total users", color: "var(--color-chart-2)" },
};

export function UserGrowthChart({ data }: { data: { month: string; users: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="users"
          type="monotone"
          stroke="var(--color-chart-2)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-chart-2)" }}
        />
      </LineChart>
    </ChartContainer>
  );
}
