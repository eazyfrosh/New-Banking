"use client";

import * as React from "react";

import { formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function InterestCalculator() {
  const [principal, setPrincipal] = React.useState(1000);
  const [rate, setRate] = React.useState(6);
  const [years, setYears] = React.useState(3);

  const result = principal * Math.pow(1 + rate / 100, years);
  const interestEarned = result - principal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interest calculator</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label>Initial deposit</Label>
          <Input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <Label>Annual interest rate</Label>
            <span className="text-muted-foreground">{rate}%</span>
          </div>
          <Slider value={[rate]} min={1} max={10} step={0.1} onValueChange={([v]) => setRate(v)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <Label>Term (years)</Label>
            <span className="text-muted-foreground">{years}</span>
          </div>
          <Slider value={[years]} min={1} max={20} step={1} onValueChange={([v]) => setYears(v)} />
        </div>

        <div className="border-border/60 rounded-xl border bg-secondary/40 p-4">
          <p className="text-muted-foreground text-xs">Projected balance</p>
          <p className="text-2xl font-semibold">{formatCurrency(result)}</p>
          <p className="text-success mt-1 text-xs">+{formatCurrency(interestEarned)} in interest</p>
        </div>
      </CardContent>
    </Card>
  );
}
