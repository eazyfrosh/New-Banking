import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
          {trend && (
            <p className={trend.positive ? "text-success mt-1 text-xs" : "text-destructive mt-1 text-xs"}>
              {trend.positive ? "+" : ""}
              {trend.value}% this month
            </p>
          )}
        </div>
        <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
