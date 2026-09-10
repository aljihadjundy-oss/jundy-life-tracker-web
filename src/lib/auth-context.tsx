"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, OWNER_EMAIL } from "./firebase";

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email !== OWNER_EMAIL) {
        firebaseSignOut(auth);
        setUser(null);
        setError("Akun ini gak punya akses ke app ini.");
      } else {
        setUser(firebaseUser);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Surfaces errors from the redirect sign-in flow once we land back here.
  useEffect(() => {
    getRedirectResult(auth).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Gagal login, coba lagi.");
    });
  }, []);

  async function signInWithGoogle() {
    setError(null);
    try {
      // Redirect instead of popup: popups are unreliable in installed PWAs
      // (standalone display mode) and in browsers blocking third-party storage.
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal login, coba lagi.");
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
