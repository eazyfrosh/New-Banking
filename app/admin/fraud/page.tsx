"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { useFraudAlerts } from "@/hooks/use-admin-data";
import { updateDocById } from "@/lib/services/firestore-helpers";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { formatDate } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const severityVariant = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
} as const;

export default function AdminFraudPage() {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading } = useFraudAlerts();

  async function updateStatus(id: string, status: "reviewed" | "dismissed") {
    await updateDocById(COLLECTIONS.fraudAlerts, id, { status });
    toast.success(`Alert marked ${status}`);
    queryClient.invalidateQueries({ queryKey: ["admin", "fraud-alerts"] });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fraud alerts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Monitor and respond to suspicious account activity.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !alerts || alerts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No fraud alerts" description="Everything looks normal." />
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={severityVariant[alert.severity]} className="capitalize">
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="mt-1.5 font-medium">{alert.reason}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{formatDate(alert.createdAt)}</p>
                </div>
                {alert.status === "open" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateStatus(alert.id, "dismissed")}>
                      Dismiss
                    </Button>
                    <Button size="sm" variant="gradient" onClick={() => updateStatus(alert.id, "reviewed")}>
                      Mark reviewed
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
