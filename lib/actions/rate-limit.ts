import "server-only";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function checkAndRecordAttempt(key: string) {
  if (!adminDb) return { allowed: true, remaining: MAX_ATTEMPTS };

  const ref = adminDb.collection("rateLimits").doc(key);
  const snap = await ref.get();
  const now = Date.now();
  const data = snap.data() as
    | { count: number; windowStart: number }
    | undefined;

  if (!data || now - data.windowStart > WINDOW_MS) {
    await ref.set({ count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (data.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  await ref.update({ count: FieldValue.increment(1) });
  return { allowed: true, remaining: MAX_ATTEMPTS - data.count - 1 };
}

export async function resetAttempts(key: string) {
  if (!adminDb) return;
  await adminDb.collection("rateLimits").doc(key).delete();
}
