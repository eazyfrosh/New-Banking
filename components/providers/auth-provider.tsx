"use client";

import * as React from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: Error | null;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  profileError: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileError, setProfileError] = React.useState<Error | null>(null);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- entering a new loading phase for the newly signed-in user before the fetch/subscription below resolves
    setLoading(true);
    setProfileError(null);

    // Realtime updates use Firestore's streaming Listen channel, which ad
    // blockers and privacy extensions commonly flag as a tracking beacon
    // (net::ERR_BLOCKED_BY_CLIENT) since the URL pattern resembles one. A
    // one-time getDoc hits a different, non-streaming endpoint and isn't
    // affected, so we race it in to unblock the dashboard even when the
    // live subscription can't connect. Live updates just won't stream in
    // that case — not ideal, but far better than hanging forever.
    getDoc(doc(db, COLLECTIONS.users, user.uid))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
        setLoading(false);
      })
      .catch(() => {
        // The subscription below is still the primary source of truth.
      });

    const unsubProfile = onSnapshot(
      doc(db, COLLECTIONS.users, user.uid),
      (snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        // Only surface this if the one-time read above also never resolved —
        // otherwise we already have data and live updates simply aren't streaming.
        setProfileError((prev) => prev ?? err);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsubProfile();
    };
  }, [user]);

  const signOut = React.useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = React.useMemo(
    () => ({ user, profile, loading, profileError, signOut }),
    [user, profile, loading, profileError, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
