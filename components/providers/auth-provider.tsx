"use client";

import * as React from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

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

    const unsubProfile = onSnapshot(
      doc(db, COLLECTIONS.users, user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubProfile();
  }, [user]);

  const signOut = React.useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = React.useMemo(
    () => ({ user, profile, loading, signOut }),
    [user, profile, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
