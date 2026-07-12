"use client";

import { Cell, Legend, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const chartConfig: ChartConfig = {
  count: { label: "Loans" },
};

export function LoanDistributionChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
}
