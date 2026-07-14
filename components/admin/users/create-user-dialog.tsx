"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { adminCreateUser } from "@/lib/actions/admin-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateUserDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleCreate() {
    if (!firstName || !lastName || !email || password.length < 8) {
      toast.error("Fill in all fields. Password must be at least 8 characters.");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const result = await adminCreateUser(idToken, { firstName, lastName, email, password });
      if (result.ok) {
        toast.success("Customer account created");
        setOpen(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient">
          <Plus className="size-4" />
          New customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create customer account</DialogTitle>
          <DialogDescription>
            This creates a fully verified customer with starter accounts and a virtual card.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Temporary password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={submitting} variant="gradient" className="w-full">
            Create account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
