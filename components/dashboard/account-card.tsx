import { CreditCard, PiggyBank, Vault } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import type { RatesResult } from "@/lib/actions/currency-actions";
import { currencyDecimals, getCurrencyInfo } from "@/lib/currencies";
import { formatCurrency, maskAccountNumber } from "@/lib/utils";
import type { Account } from "@/types";

const iconByType = {
  current: CreditCard,
  savings: PiggyBank,
  fixed_deposit: Vault,
} as const;

export function AccountCard({
  account,
  displayCurrency,
  rates,
}: {
  account: Account;
  /** The user's preferred display currency (Profile > Preferences). When it
   * differs from the account's own currency, a converted equivalent is
   * shown alongside the real balance - the stored balance itself never
   * changes, only what's shown next to it. */
  displayCurrency?: string;
  rates?: RatesResult;
}) {
  const Icon = iconByType[account.type];
  const currency = getCurrencyInfo(account.currency);

  const showConverted = !!displayCurrency && !!rates && displayCurrency !== account.currency;
  let convertedAmount: number | null = null;
  if (showConverted && rates) {
    if (rates.base === account.currency) {
      const rate = rates.rates[displayCurrency!];
      if (rate) convertedAmount = account.balance * rate;
    } else if (rates.base === displayCurrency) {
      const rate = rates.rates[account.currency];
      if (rate) convertedAmount = account.balance / rate;
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="bg-mesh pointer-events-none absolute inset-0 opacity-60" />
      <CardContent className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <Icon className="size-5" />
          </span>
          <div className="flex items-center gap-1.5">
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
              {currency.flag} {account.currency}
            </span>
            {account.isPrimary && (
              <span className="bg-success/15 text-success rounded-full px-2 py-0.5 text-[10px] font-medium">
                Primary
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{account.name}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            <AnimatedCounter
              value={account.balance}
              prefix={currency.symbol}
              decimals={currencyDecimals(account.currency)}
            />
          </p>
          {convertedAmount !== null && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              &asymp; {formatCurrency(convertedAmount, displayCurrency)}
            </p>
          )}
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{maskAccountNumber(account.accountNumber)}</span>
          {account.interestRate && <span>{account.interestRate}% APY</span>}
        </div>
      </CardContent>
    </Card>
  );
}
