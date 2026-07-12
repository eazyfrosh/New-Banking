"use client";

import * as React from "react";
import { Search, Users } from "lucide-react";

import { useAllUsers } from "@/hooks/use-admin-data";
import { formatDate } from "@/lib/utils";

import { CreateUserDialog } from "@/components/admin/users/create-user-dialog";
import { UserRowActions } from "@/components/admin/users/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/utils";

const statusVariant = {
  active: "success",
  suspended: "warning",
  closed: "destructive",
} as const;

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAllUsers();
  const [query, setQuery] = React.useState("");

  const filtered = (users ?? []).filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage customer accounts and balances.</p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search users..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-[10px]">
                          {initials(`${user.firstName} ${user.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="capitalize">{user.kycStatus}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[user.status]} className="capitalize">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt, { dateStyle: "medium" })}</TableCell>
                  <TableCell className="text-right">
                    <UserRowActions user={user} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
