import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

import { readFirebaseClientEnv } from "@/lib/firebase/env";

interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let client: FirebaseClient | null = null;
let emulatorsConnected = false;

/**
 * Lazily creates the Firebase client SDK singleton on first call, in the
 * browser only. Nothing here runs at module scope: importing this file -
 * even transitively, during SSR or static prerendering - has no side
 * effects and cannot throw during a build. A missing or invalid client
 * config only surfaces when a browser component actually tries to use
 * Firebase, as a normal thrown error.
 */
function getClient(): FirebaseClient {
  if (client) return client;

  if (typeof window === "undefined") {
    throw new Error(
      "Firebase client SDK was accessed outside the browser. Use the Admin SDK (@/lib/firebase/admin) for server-side code."
    );
  }

  const result = readFirebaseClientEnv();
  if (!result.ok) {
    throw new Error(`Firebase client is not configured: ${result.error}`);
  }

  const app = getApps()[0] ?? initializeApp(result.env);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" && !emulatorsConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    emulatorsConnected = true;
  }

  client = { app, auth, db, storage };
  return client;
}

export function getFirebaseAuth(): Auth {
  return getClient().auth;
}

export function getFirebaseDb(): Firestore {
  return getClient().db;
}

export function getFirebaseStorage(): FirebaseStorage {
  return getClient().storage;
}

/** True if every required client env var is present. Safe to call anywhere, never throws. */
export function isFirebaseClientConfigured(): boolean {
  return readFirebaseClientEnv().ok;
}
