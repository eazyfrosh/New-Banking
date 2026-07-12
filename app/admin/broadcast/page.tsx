"use client";

import * as React from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

import { adminBroadcastNotification } from "@/lib/actions/admin-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminBroadcastPage() {
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [type, setType] = React.useState<"system" | "promo" | "security">("system");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSend() {
    if (!title || !message) {
      toast.error("Fill in a title and message.");
      return;
    }
    setSubmitting(true);
    const result = await adminBroadcastNotification({ title, message, type });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Broadcast sent to all users");
      setTitle("");
      setMessage("");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Broadcast notification</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Send an announcement to every customer&apos;s notification center.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-4.5" />
            New broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System update</SelectItem>
                <SelectItem value="promo">Promotion</SelectItem>
                <SelectItem value="security">Security notice</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scheduled maintenance" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </div>
          <Button onClick={handleSend} disabled={submitting} variant="gradient" className="w-fit">
            Send to all customers
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
