"use client";

import { CreditCard } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { useCards } from "@/hooks/use-cards";
import { useTransactions } from "@/hooks/use-transactions";

import { AddCardDialog } from "@/components/dashboard/cards/add-card-dialog";
import { CardPanel } from "@/components/dashboard/cards/card-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { maskCardNumber } from "@/lib/utils";

export default function CardsPage() {
  const { profile } = useAuth();
  const { data: accounts } = useAccounts(profile?.uid);
  const { data: cards, loading } = useCards(profile?.uid);
  const { data: transactions } = useTransactions(profile?.uid);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cards</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your virtual and physical cards in one place.
          </p>
        </div>
        {profile && (
          <AddCardDialog
            userId={profile.uid}
            accounts={accounts}
            cardholderName={`${profile.firstName} ${profile.lastName}`}
          />
        )}
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full max-w-md" />
      ) : cards.length === 0 ? (
        <EmptyState icon={CreditCard} title="No cards yet" description="Issue your first card to get started." />
      ) : (
        <Tabs defaultValue={cards[0].id}>
          <TabsList className="h-auto flex-wrap">
            {cards.map((card) => (
              <TabsTrigger key={card.id} value={card.id}>
                {card.type === "virtual" ? "Virtual" : "Physical"} &middot; {maskCardNumber(card.cardNumber).slice(-4)}
              </TabsTrigger>
            ))}
          </TabsList>
          {cards.map((card) => (
            <TabsContent key={card.id} value={card.id} className="mt-6">
              <CardPanel
                card={card}
                userId={profile!.uid}
                transactions={transactions.filter((tx) => tx.accountId === card.accountId).slice(0, 8)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
