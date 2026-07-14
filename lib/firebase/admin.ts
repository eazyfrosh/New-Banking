import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

import { readFirebaseAdminEnv } from "@/lib/firebase/env";

interface FirebaseAdminCore {
  app: App;
  db: Firestore;
}

let core: FirebaseAdminCore | null = null;
let cachedError: string | null = null;
let auth: Auth | null = null;

/**
 * Lazily creates the Firebase Admin app + Firestore singleton on first call.
 * Nothing here runs at module scope: importing this file cannot throw during
 * prerendering. A missing or malformed service-account credential (the
 * single biggest cause of "works locally, breaks on Vercel") only surfaces
 * when a server action actually tries to use it, as a normal thrown error
 * with the real underlying reason - never as an unhandled crash during a
 * build or an SSR render pass.
 */
function getCore(): FirebaseAdminCore {
  if (core) return core;
  if (cachedError) throw new Error(cachedError);

  const result = readFirebaseAdminEnv();
  if (!result.ok) {
    cachedError = result.error;
    throw new Error(result.error);
  }

  try {
    const app = getApps()[0] ?? initializeApp({ credential: cert(result.env) });
    core = { app, db: getFirestore(app) };
    return core;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    cachedError = message;
    console.error("[firebase/admin] Failed to initialize Admin SDK:", err);
    throw new Error(message);
  }
}

/**
 * firebase-admin/auth transitively requires jwks-rsa, which requires the
 * ESM-only `jose` package - a static top-level import of firebase-admin/auth
 * previously dragged that chain into every consumer of this file at module
 * load time, including Firestore-only code paths (like account setup) that
 * never call this function. Importing it dynamically, only here, means that
 * chain is only ever loaded by callers that actually need Auth.
 */
export async function getAdminAuth(): Promise<Auth> {
  if (auth) return auth;
  const { app } = getCore();
  const { getAuth } = await import("firebase-admin/auth");
  auth = getAuth(app);
  return auth;
}

export function getAdminDb(): Firestore {
  return getCore().db;
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
    getCore();
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
