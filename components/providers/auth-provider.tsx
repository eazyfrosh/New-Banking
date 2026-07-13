"use client";

import * as React from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, type FirestoreError } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { initializeCustomerAccount } from "@/lib/actions/onboarding";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** True once we've confirmed (via a successful read) that no profile document exists for this user. */
  profileMissing: boolean;
  /** Set only when a read actually failed (network/permission/etc) — never set for a confirmed-missing doc. */
  profileError: FirestoreError | Error | null;
  /** Re-runs account setup for a signed-in user with no profile — recovers accounts left orphaned by a failed registration. */
  retryProfileSetup: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  profileMissing: false,
  profileError: null,
  retryProfileSetup: async () => ({ ok: false, error: "Not initialized" }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileMissing, setProfileMissing] = React.useState(false);
  const [profileError, setProfileError] = React.useState<FirestoreError | Error | null>(null);

  React.useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  React.useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let resolvedOnce = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- entering a new loading phase for the newly signed-in user before the fetch/subscription below resolves
    setLoading(true);
    setProfileError(null);
    setProfileMissing(false);

    function applySnapshot(exists: boolean, data: (UserProfile & { uid?: string }) | undefined, id: string) {
      if (cancelled) return;
      resolvedOnce = true;
      if (exists && data) {
        setProfile({ ...data, uid: id } as UserProfile);
        setProfileMissing(false);
      } else {
        setProfile(null);
        setProfileMissing(true);
      }
      setProfileError(null);
      setLoading(false);
    }

    // Realtime updates use Firestore's streaming Listen channel. Some
    // networks (corporate proxies, certain browser extensions) block that
    // specific connection while leaving normal HTTPS requests untouched. A
    // one-time getDoc hits a different, non-streaming endpoint and isn't
    // affected by that class of block, so we race it in to unblock the UI
    // even when the live subscription can't connect.
    getDoc(doc(db, COLLECTIONS.users, user.uid))
      .then((snap) => {
        applySnapshot(snap.exists(), snap.data() as UserProfile | undefined, snap.id);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[AuthProvider] getDoc(users/" + user.uid + ") failed:", err);
      });

    const unsubProfile = onSnapshot(
      doc(db, COLLECTIONS.users, user.uid),
      (snap) => {
        applySnapshot(snap.exists(), snap.data() as UserProfile | undefined, snap.id);
      },
      (err) => {
        if (cancelled) return;
        console.error("[AuthProvider] onSnapshot(users/" + user.uid + ") failed:", err.code, err.message, err);
        // Only surface this as a hard error if nothing has resolved yet —
        // if the getDoc above already succeeded, this is just the live
        // stream failing to connect, which we've already recovered from.
        if (!resolvedOnce) {
          setProfileError(err);
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubProfile();
    };
  }, [user]);

  const retryProfileSetup = React.useCallback(async () => {
    if (!user) return { ok: false, error: "Not signed in." };

    const [firstName, ...rest] = (user.displayName || user.email?.split("@")[0] || "Customer").split(" ");
    const lastName = rest.join(" ") || "Account";

    const result = await initializeCustomerAccount({
      uid: user.uid,
      email: user.email ?? "",
      firstName,
      lastName,
    });

    if (!result.ok) {
      console.error("[AuthProvider] retryProfileSetup failed:", result.error);
      return { ok: false, error: result.error };
    }

    try {
      const snap = await getDoc(doc(db, COLLECTIONS.users, user.uid));
      if (snap.exists()) {
        setProfile({ ...(snap.data() as UserProfile), uid: snap.id });
        setProfileMissing(false);
        setProfileError(null);
      }
    } catch (err) {
      console.error("[AuthProvider] re-fetch after retryProfileSetup failed:", err);
    }

    return { ok: true };
  }, [user]);

  const signOut = React.useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = React.useMemo(
    () => ({ user, profile, loading, profileMissing, profileError, retryProfileSetup, signOut }),
    [user, profile, loading, profileMissing, profileError, retryProfileSetup, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
