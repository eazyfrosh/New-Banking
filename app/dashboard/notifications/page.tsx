"use client";

import { Archive, Bell, BellRing, Check } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { archiveNotification, markNotificationRead } from "@/lib/services/notifications";
import { formatDate } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const typeVariant = {
  transaction: "default",
  security: "destructive",
  loan: "warning",
  system: "secondary",
  promo: "success",
} as const;

export default function NotificationsPage() {
  const { profile } = useAuth();
  const { notifications, unreadCount, loading } = useNotifications(profile?.uid);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications.` : "You're all caught up."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="New activity will show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <Card key={n.id} className={!n.read ? "border-primary/30" : undefined}>
              <CardContent className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <BellRing className="size-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <Badge variant={typeVariant[n.type]} className="capitalize">
                        {n.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-sm">{n.message}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{formatDate(n.createdAt)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!n.read && (
                    <Button variant="ghost" size="icon" onClick={() => markNotificationRead(n.id)} aria-label="Mark as read">
                      <Check className="size-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => archiveNotification(n.id)} aria-label="Archive">
                    <Archive className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
