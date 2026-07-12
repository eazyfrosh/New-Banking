"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { auth, db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

function firebaseAuthErrorMessage(code: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/user-disabled":
      return "This account has been suspended. Contact support.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      const snap = await getDoc(doc(db, COLLECTIONS.users, credential.user.uid));
      const role = snap.exists() ? snap.data().role : "customer";

      toast.success("Welcome back!");
      router.push(role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch (error) {
      const code = error instanceof Error && "code" in error ? String((error as { code: string }).code) : "";
      toast.error(firebaseAuthErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sign in to access your Nexora account.
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-primary text-xs font-medium underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-muted-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-2">
            <Checkbox id="remember" defaultChecked />
            <Label htmlFor="remember" className="text-muted-foreground font-normal">
              Keep me signed in
            </Label>
          </div>

          <Button type="submit" size="lg" variant="gradient" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary font-medium underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
