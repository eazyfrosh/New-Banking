import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// This module's top-level initialization runs on import, before any calling
// function's own try/catch exists as a stack frame - a credential error here
// (e.g. a malformed FIREBASE_PRIVATE_KEY) would otherwise throw uncaught
// during the server's render/action pass, surfacing only as Next's generic
// "An error occurred in the Server Components render" with no indication of
// the real cause. Every failure mode here must be caught and turned into
// isAdminConfigured=false + a captured reason instead.
function buildAdminApp(): { app: App | null; error: string | null } {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && "FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !privateKey && "FIREBASE_PRIVATE_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    return { app: null, error: `Missing environment variable(s): ${missing}` };
  }

  try {
    const existing = getApps()[0];
    if (existing) return { app: existing, error: null };

    const app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return { app, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[firebase/admin] Failed to initialize Admin SDK:", err);
    return { app: null, error: message };
  }
}

const { app: adminApp, error: adminInitError } = buildAdminApp();

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const isAdminConfigured = Boolean(adminApp);
/** Set when Admin SDK initialization failed, with the real underlying reason. */
export const adminConfigError = adminInitError;
