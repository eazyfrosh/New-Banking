"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), values.email);
      setSent(true);
    } catch {
      // Avoid leaking whether an email exists.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4">
        <span className="bg-success/10 text-success flex size-11 items-center justify-center rounded-full">
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Check your inbox</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            If an account exists for <strong>{form.getValues("email")}</strong>, we&apos;ve sent a
            password reset link.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/login">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter the email associated with your account and we&apos;ll send a reset link.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" variant="gradient" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      </Form>

      <Link
        href="/login"
        className="text-muted-foreground flex items-center justify-center gap-1 text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </div>
  );
}
