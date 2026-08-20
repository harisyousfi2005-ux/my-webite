"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    apiFetch<User | null>("/me", { base: "/api/auth" })
      .then((result) => {
        setUser(result);
        setStatus(result ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        setUser(null);
        setStatus("unauthenticated");
      });
  }, []);

  async function login(email: string, password: string) {
    const result = await apiFetch<{ user: User }>("/login", {
      method: "POST",
      body: { email, password },
      base: "/api/auth",
    });
    setUser(result.user);
    setStatus("authenticated");
  }

  async function register(input: RegisterInput) {
    const result = await apiFetch<{ user: User }>("/register", {
      method: "POST",
      body: input,
      base: "/api/auth",
    });
    setUser(result.user);
    setStatus("authenticated");
  }

  async function logout() {
    await apiFetch("/logout", { method: "POST", base: "/api/auth" });
    setUser(null);
    setStatus("unauthenticated");
  }

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
