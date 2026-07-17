"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, RotateCcw, ScrollText, Search } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { useAuditLogs } from "@/hooks/use-admin-data";
import { adminUndoLastTransactionEdit } from "@/lib/actions/admin-actions";
import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function FieldDiff({ log }: { log: AuditLog }) {
  const fields = log.changedFields ?? [];
  const before = (log.before ?? {}) as Record<string, unknown>;
  const after = (log.after ?? {}) as Record<string, unknown>;

  if (fields.length === 0) {
    return (
      <div className="text-muted-foreground px-4 py-3 text-xs">
        No field-level changes recorded for this action.
      </div>
    );
  }

  return (
    <div className="divide-border/60 divide-y px-4 py-2">
      {fields.map((field) => (
        <div key={field} className="flex items-center justify-between gap-4 py-1.5 text-xs">
          <span className="text-muted-foreground w-32 shrink-0 font-medium capitalize">{field}</span>
          <span className="text-destructive/80 line-through">{displayValue(before[field])}</span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className="text-success flex-1 text-right font-medium">{displayValue(after[field])}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAuditLogPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: logs, isLoading } = useAuditLogs();
  const [query, setQuery] = React.useState("");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [undoing, setUndoing] = React.useState(false);

  const filtered = (logs ?? []).filter(
    (log) =>
      log.action.toLowerCase().includes(query.toLowerCase()) ||
      log.adminEmail.toLowerCase().includes(query.toLowerCase()) ||
      (log.targetUserId ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (log.targetId ?? "").toLowerCase().includes(query.toLowerCase())
  );

  // logs is already ordered by createdAt desc, so the first matching entry is the most recent.
  const lastUndoableEdit = (logs ?? []).find((log) => log.action === "admin.editTransaction" && !log.undone);

  async function handleUndo() {
    if (!user) return;
    setUndoing(true);
    try {
      const idToken = await user.getIdToken();
      const result = await adminUndoLastTransactionEdit(idToken);
      if (result.ok) {
        toast.success("Last transaction edit undone");
        queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setUndoing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Every admin action, who performed it, and what changed.
          </p>
        </div>
        <Button variant="outline" onClick={handleUndo} disabled={!lastUndoableEdit || undoing}>
          <RotateCcw className="size-4" />
          Undo last edit
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by action, admin, customer, or target ID..."
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
                <TableHead className="w-8" />
                <TableHead>Time</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead>Fields changed</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map((log) => {
                const hasDiff = (log.changedFields?.length ?? 0) > 0;
                const isExpanded = expanded === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <TableRow
                      className={hasDiff ? "hover:bg-muted/50 cursor-pointer" : undefined}
                      onClick={() => hasDiff && setExpanded(isExpanded ? null : log.id)}
                    >
                      <TableCell>
                        {hasDiff &&
                          (isExpanded ? (
                            <ChevronDown className="text-muted-foreground size-4" />
                          ) : (
                            <ChevronRight className="text-muted-foreground size-4" />
                          ))}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                      </TableCell>
                      <TableCell className="font-medium">{log.adminEmail || log.adminUid}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline">{log.action}</Badge>
                          {log.undone && (
                            <Badge variant="secondary" className="text-[10px]">
                              Undone
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {log.targetUserId ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {log.targetId ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {log.changedFields && log.changedFields.length > 0 ? log.changedFields.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.ip ?? "—"}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-0">
                          <FieldDiff log={log} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
