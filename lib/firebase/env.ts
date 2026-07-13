/**
 * Firebase environment variable reading and validation, shared by both the
 * client and Admin SDK wrappers. Centralized here so both sides validate
 * consistently and neither has to duplicate the "what's missing" logic.
 */

export interface FirebaseClientEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type EnvResult<T> = { ok: true; env: T } | { ok: false; error: string };

export function readFirebaseClientEnv(): EnvResult<FirebaseClientEnv> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  const missing = [
    !apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
    !authDomain && "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    !projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    !storageBucket && "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    !messagingSenderId && "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    !appId && "NEXT_PUBLIC_FIREBASE_APP_ID",
  ].filter((v): v is string => Boolean(v));

  if (missing.length > 0) {
    return { ok: false, error: `Missing environment variable(s): ${missing.join(", ")}` };
  }

  return {
    ok: true,
    env: { apiKey: apiKey!, authDomain: authDomain!, projectId: projectId!, storageBucket: storageBucket!, messagingSenderId: messagingSenderId!, appId: appId! },
  };
}

export interface FirebaseAdminEnv {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export function readFirebaseAdminEnv(): EnvResult<FirebaseAdminEnv> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel (and most env var UIs) can't store literal newlines cleanly, so
  // the key is stored with escaped \n sequences and unescaped here.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const missing = [
    !projectId && "FIREBASE_PROJECT_ID",
    !clientEmail && "FIREBASE_CLIENT_EMAIL",
    !privateKey && "FIREBASE_PRIVATE_KEY",
  ].filter((v): v is string => Boolean(v));

  if (missing.length > 0) {
    return { ok: false, error: `Missing environment variable(s): ${missing.join(", ")}` };
  }

  return { ok: true, env: { projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey! } };
}
