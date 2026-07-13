import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

// firebase/auth validates the apiKey format synchronously inside getAuth(),
// throwing auth/invalid-api-key if it's missing or malformed. This module is
// imported transitively by the root layout (via AuthProvider), so Next.js
// evaluates it during SSR and static prerendering (e.g. building
// /_not-found) - a context that never legitimately needs a real client SDK
// instance, since every consumer here is a client component (or a helper
// only ever called from one) whose data fetching runs in the browser after
// hydration, never during prerendering. Only actually initialize in the
// browser, so a missing/misconfigured key at build time can't fail the
// build; server-side code should use the Admin SDK (@/lib/firebase/admin)
// instead, never this module.
const isBrowser = typeof window !== "undefined";

export const firebaseApp = isBrowser
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : (null as unknown as FirebaseApp);

export const auth = isBrowser ? getAuth(firebaseApp) : (null as unknown as Auth);
export const db = isBrowser ? getFirestore(firebaseApp) : (null as unknown as Firestore);
export const storage = isBrowser ? getStorage(firebaseApp) : (null as unknown as FirebaseStorage);

const emulatorsStarted = globalThis as unknown as {
  __FIREBASE_EMULATORS_CONNECTED__?: boolean;
};

if (
  isBrowser &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
  !emulatorsStarted.__FIREBASE_EMULATORS_CONNECTED__
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  emulatorsStarted.__FIREBASE_EMULATORS_CONNECTED__ = true;
}
