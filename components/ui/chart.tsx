"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
    icon?: React.ComponentType;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, cfg]) => cfg.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, cfg]) => `  --color-${key}: ${cfg.color};`)
          .join("\n")}\n}`,
      }}
    />
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipPayloadItem = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  formatter,
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string | number;
  className?: string;
  indicator?: "line" | "dot" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  labelFormatter?: (label: string | number, payload: ChartTooltipPayloadItem[]) => React.ReactNode;
  formatter?: (
    value: number | string,
    name: string | number,
    item: ChartTooltipPayloadItem,
    index: number,
    payload?: Record<string, unknown>
  ) => React.ReactNode;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-border/60 bg-popover text-popover-foreground grid min-w-[10rem] gap-1.5 rounded-xl border px-3 py-2.5 text-xs shadow-lg",
        className
      )}
    >
      {!hideLabel && label !== undefined ? (
        <div className="font-medium">
          {labelFormatter ? labelFormatter(label, payload) : label}
        </div>
      ) : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? index);
          const cfg = config[key];
          const color = item.color ?? cfg?.color;

          return (
            <div
              key={key}
              className="flex w-full items-center gap-2 [&>svg]:size-3 [&>svg]:text-muted-foreground"
            >
              {!hideIndicator && (
                <div
                  className={cn(
                    "shrink-0 rounded-[2px]",
                    indicator === "dot" && "size-2 rounded-full",
                    indicator === "line" && "w-1 h-3",
                    indicator === "dashed" &&
                      "w-0 border-[1.5px] border-dashed h-3"
                  )}
                  style={{
                    backgroundColor:
                      indicator !== "dashed" ? color : undefined,
                    borderColor: color,
                  }}
                />
              )}
              <div className="flex flex-1 justify-between leading-none">
                <span className="text-muted-foreground">
                  {cfg?.label ?? item.name}
                </span>
                <span className="text-foreground font-mono font-medium tabular-nums">
                  {formatter
                    ? formatter(
                        item.value ?? "",
                        item.name ?? "",
                        item,
                        index,
                        item.payload
                      )
                    : typeof item.value === "number"
                      ? item.value.toLocaleString()
                      : item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  payload,
  hideIcon = false,
}: {
  className?: string;
  payload?: readonly { value?: string; dataKey?: string | number; color?: string }[];
  hideIcon?: boolean;
}) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? item.value ?? index);
        const cfg = config[key];

        return (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            {!hideIcon && (
              <div
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            {cfg?.label ?? item.value}
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
