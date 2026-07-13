import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { readFirebaseAdminEnv } from "@/lib/firebase/env";

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
}

let admin: FirebaseAdmin | null = null;
let cachedError: string | null = null;

/**
 * Lazily creates the Firebase Admin SDK singleton on first call. Nothing
 * here runs at module scope: importing this file cannot throw during
 * prerendering. A missing or malformed service-account credential (the
 * single biggest cause of "works locally, breaks on Vercel") only surfaces
 * when a server action actually tries to use it, as a normal thrown error
 * with the real underlying reason - never as an unhandled crash during a
 * build or an SSR render pass.
 */
function getAdmin(): FirebaseAdmin {
  if (admin) return admin;
  if (cachedError) throw new Error(cachedError);

  const result = readFirebaseAdminEnv();
  if (!result.ok) {
    cachedError = result.error;
    throw new Error(result.error);
  }

  try {
    const app = getApps()[0] ?? initializeApp({ credential: cert(result.env) });
    admin = { app, auth: getAuth(app), db: getFirestore(app) };
    return admin;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    cachedError = message;
    console.error("[firebase/admin] Failed to initialize Admin SDK:", err);
    throw new Error(message);
  }
}

export function getAdminAuth(): Auth {
  return getAdmin().auth;
}

export function getAdminDb(): Firestore {
  return getAdmin().db;
}

/** True if every required Admin SDK env var is present. Safe to call anywhere, never throws. */
export function isFirebaseAdminConfigured(): boolean {
  return readFirebaseAdminEnv().ok;
}

/**
 * Returns the reason the Admin SDK is unavailable (missing env var, bad
 * credential, etc), or null if it's healthy. Never throws - use this in
 * server actions to fail gracefully with a real, specific message instead
 * of letting getAdminDb()/getAdminAuth() throw uncaught.
 */
export function getAdminInitError(): string | null {
  try {
    getAdmin();
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
