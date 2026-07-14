"use client";

import * as React from "react";
import { ScrollText, Search } from "lucide-react";

import { useAuditLogs } from "@/hooks/use-admin-data";
import { formatDate } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminAuditLogPage() {
  const { data: logs, isLoading } = useAuditLogs();
  const [query, setQuery] = React.useState("");

  const filtered = (logs ?? []).filter(
    (log) =>
      log.action.toLowerCase().includes(query.toLowerCase()) ||
      log.adminEmail.toLowerCase().includes(query.toLowerCase()) ||
      (log.targetUserId ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every admin action, who performed it, and what changed.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by action, admin or customer..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit log entries" />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                  </TableCell>
                  <TableCell className="font-medium">{log.adminEmail || log.adminUid}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {log.targetUserId ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.ip ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
