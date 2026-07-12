import type { Loan, Transaction, UserProfile } from "@/types";

function dayKey(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function monthKey(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function dailyTransactionVolume(transactions: Transaction[], days = 14) {
  const buckets = new Map<string, { date: string; count: number; volume: number }>();
  const cutoff = Date.now() - days * 86400000;

  for (const tx of transactions) {
    const ts = new Date(tx.createdAt).getTime();
    if (ts < cutoff) continue;
    const key = dayKey(tx.createdAt);
    const bucket = buckets.get(key) ?? { date: key, count: 0, volume: 0 };
    bucket.count += 1;
    bucket.volume += tx.amount;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values());
}

export function monthlyRevenue(transactions: Transaction[], months = 6) {
  const buckets = new Map<string, { month: string; revenue: number }>();
  const cutoff = Date.now() - months * 31 * 86400000;

  for (const tx of transactions) {
    const ts = new Date(tx.createdAt).getTime();
    if (ts < cutoff) continue;
    const key = monthKey(tx.createdAt);
    const bucket = buckets.get(key) ?? { month: key, revenue: 0 };
    bucket.revenue += tx.fee ?? tx.amount * 0.015;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values());
}

export function userGrowth(users: UserProfile[], months = 6) {
  const buckets = new Map<string, { month: string; users: number }>();
  const cutoff = Date.now() - months * 31 * 86400000;
  let cumulative = users.filter((u) => new Date(u.createdAt).getTime() < cutoff).length;

  const sorted = [...users]
    .filter((u) => new Date(u.createdAt).getTime() >= cutoff)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const user of sorted) {
    const key = monthKey(user.createdAt);
    cumulative += 1;
    buckets.set(key, { month: key, users: cumulative });
  }

  return Array.from(buckets.values());
}

export function depositsVsWithdrawals(transactions: Transaction[], months = 6) {
  const buckets = new Map<string, { month: string; deposits: number; withdrawals: number }>();
  const cutoff = Date.now() - months * 31 * 86400000;

  for (const tx of transactions) {
    const ts = new Date(tx.createdAt).getTime();
    if (ts < cutoff) continue;
    if (tx.type !== "deposit" && tx.type !== "withdrawal") continue;
    const key = monthKey(tx.createdAt);
    const bucket = buckets.get(key) ?? { month: key, deposits: 0, withdrawals: 0 };
    if (tx.type === "deposit") bucket.deposits += tx.amount;
    else bucket.withdrawals += tx.amount;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values());
}

export function loanDistribution(loans: Loan[]) {
  const counts = new Map<string, number>();
  for (const loan of loans) {
    counts.set(loan.status, (counts.get(loan.status) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

export function transferVolume(transactions: Transaction[], months = 6) {
  const buckets = new Map<string, { month: string; internal: number; bank: number; international: number }>();
  const cutoff = Date.now() - months * 31 * 86400000;

  for (const tx of transactions) {
    const ts = new Date(tx.createdAt).getTime();
    if (ts < cutoff) continue;
    if (!tx.type.startsWith("transfer_")) continue;
    const key = monthKey(tx.createdAt);
    const bucket = buckets.get(key) ?? { month: key, internal: 0, bank: 0, international: 0 };
    if (tx.type === "transfer_internal") bucket.internal += tx.amount;
    else if (tx.type === "transfer_bank") bucket.bank += tx.amount;
    else if (tx.type === "transfer_international") bucket.international += tx.amount;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values());
}
