"use client";

import { useQueryClient } from "@tanstack/react-query";
import { TicketCheck } from "lucide-react";
import { toast } from "sonner";

import { useSupportTickets } from "@/hooks/use-admin-data";
import { updateDocById } from "@/lib/services/firestore-helpers";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { formatDate } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant = {
  open: "warning",
  in_progress: "default",
  resolved: "success",
  closed: "secondary",
} as const;

export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const { data: tickets, isLoading } = useSupportTickets();

  async function resolve(id: string) {
    await updateDocById(COLLECTIONS.supportTickets, id, { status: "resolved" });
    toast.success("Ticket marked resolved");
    queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support tickets</h1>
        <p className="text-muted-foreground mt-1 text-sm">Track and resolve customer support requests.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !tickets || tickets.length === 0 ? (
        <EmptyState icon={TicketCheck} title="No support tickets" description="You're all caught up." />
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{ticket.subject}</p>
                    <Badge variant={statusVariant[ticket.status]} className="capitalize">
                      {ticket.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {ticket.priority} priority
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{ticket.message}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{formatDate(ticket.createdAt)}</p>
                </div>
                {ticket.status !== "resolved" && ticket.status !== "closed" && (
                  <Button size="sm" variant="outline" onClick={() => resolve(ticket.id)}>
                    Mark resolved
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
