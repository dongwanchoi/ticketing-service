"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import * as api from "../api";

type AuthState =
  | { status: "loading" | "anonymous"; user: null; error: null }
  | { status: "authenticated"; user: api.AuthUser; error: null }
  | { status: "error"; user: null; error: string };
type AuthContextValue = {
  state: AuthState;
  busy: boolean;
  notice: string | null;
  refresh: () => Promise<api.AuthUser | null>;
  signup: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, error: null });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const working = useRef(false);
  const version = useRef(0);
  const invalidate = useCallback(() => { version.current++; }, []);

  const refresh = useCallback(async () => {
    const requestVersion = ++version.current;
    try {
      const user = await api.getCurrentUser();
      if (requestVersion === version.current) {
        setState(user ? { status: "authenticated", user, error: null } : { status: "anonymous", user: null, error: null });
      }
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "로그인 상태를 확인하지 못했습니다.";
      if (requestVersion === version.current) setState({ status: "error", user: null, error: message });
      throw error;
    }
  }, []);

  useEffect(() => {
    const recheck = () => {
      if (!working.current && document.visibilityState === "visible") void refresh().catch(() => {});
    };
    recheck();
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      invalidate();
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, [refresh, invalidate]);

  async function changeSession(action: () => Promise<string | null | void>, expectedUser?: boolean) {
    if (working.current) throw new Error("이전 요청을 처리하고 있습니다. 잠시 기다려 주세요.");
    working.current = true;
    version.current++; // Ignore a /me response started before this mutation.
    setBusy(true);
    setNotice(null);
    try {
      const warning = await action();
      if (warning) setNotice(warning);
      if (expectedUser === undefined) return; // Signup does not change the session or auto-login.
      const user = await refresh();
      if (expectedUser === true && !user) {
        throw new Error("로그인 세션을 확인할 수 없습니다. 쿠키 허용 설정을 확인한 뒤 다시 로그인해 주세요.");
      }
      if (expectedUser === false && user) throw new Error("로그아웃 상태를 확인하지 못했습니다. 다시 확인해 주세요.");
    } catch (error) {
      // A network failure may follow a server commit. Reconcile instead of assuming success/failure.
      await refresh().catch(() => {});
      throw error;
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthContext.Provider value={{ state, busy, notice, refresh,
      signup: (username, password) => changeSession(() => api.signup(username, password)),
      login: (username, password) => changeSession(() => api.login(username, password), true),
      logout: () => changeSession(api.logout, false),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required");
  return context;
}
