"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { markNotificationRead } from "@/lib/services/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications(user?.uid);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="bg-destructive absolute top-1 right-1 flex size-2 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 p-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">
              You&apos;re all caught up.
            </p>
          ) : (
            <div className="flex flex-col">
              {notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  className="hover:bg-muted/50 flex flex-col gap-0.5 border-b border-border/40 p-3 text-left last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="bg-primary size-1.5 rounded-full" />}
                    <p className="text-sm font-medium">{n.title}</p>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">{n.message}</p>
                  <p className="text-muted-foreground text-[10px]">{formatDate(n.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border/60 p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/dashboard/notifications">View all</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
