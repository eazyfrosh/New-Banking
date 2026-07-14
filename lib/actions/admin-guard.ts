import "server-only";
import { headers } from "next/headers";

import { getAdminAuth, getAdminDb, getAdminInitError } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export type AdminGuardResult =
  | { ok: true; uid: string; email: string }
  | { ok: false; error: string };

/**
 * Verifies the caller holds a valid Firebase ID token AND that the
 * corresponding Firestore user document has role == "admin". The Admin SDK
 * bypasses Firestore security rules entirely, so every admin server action
 * must call this first - it is the only real authorization boundary for
 * these writes, since a client-side role check alone can't stop a forged
 * request straight to the server action.
 */
export async function requireAdmin(idToken: string): Promise<AdminGuardResult> {
  const adminError = getAdminInitError();
  if (adminError) return { ok: false, error: `Server is not configured: ${adminError}` };

  if (!idToken) return { ok: false, error: "Not signed in." };

  try {
    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const snap = await getAdminDb().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const role = snap.data()?.role;
    if (role !== "admin") {
      return { ok: false, error: "Forbidden: admin privileges required." };
    }
    return { ok: true, uid: decoded.uid, email: decoded.email ?? "" };
  } catch {
    return { ok: false, error: "Invalid or expired session. Please sign in again." };
  }
}

async function requestIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  } catch {
    return null;
  }
}

function sanitize(value: unknown): unknown {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

interface AuditLogInput {
  adminUid: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  before?: unknown;
  after?: unknown;
}

/** Records who did what to whom, with a before/after snapshot. Never throws - a failed audit write must not undo or block the action it's logging. */
export async function writeAuditLog(input: AuditLogInput) {
  try {
    const ip = await requestIp();
    await getAdminDb()
      .collection(COLLECTIONS.auditLogs)
      .add({
        adminUid: input.adminUid,
        adminEmail: input.adminEmail,
        action: input.action,
        targetUserId: input.targetUserId ?? null,
        before: sanitize(input.before),
        after: sanitize(input.after),
        ip,
        createdAt: new Date().toISOString(),
      });
  } catch (err) {
    console.error("[writeAuditLog] failed:", err);
  }
}
