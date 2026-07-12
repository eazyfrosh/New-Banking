import type { Metadata } from "next";

import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata: Metadata = { title: "Verify Email" };

export default function VerifyEmailPage() {
  return <VerifyEmailPanel />;
}
