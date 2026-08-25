"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { postToNative } from "@/lib/native-bridge";
import {
  getBridgeSnapshot,
  getServerBridgeSnapshot,
  subscribeBridge,
} from "@/lib/native-bridge-store";
import type { NativeTheme } from "@/types/bridge";

interface AuthContextValue {
  token: string | null;
  theme: NativeTheme;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, theme } = useSyncExternalStore(
    subscribeBridge,
    getBridgeSnapshot,
    getServerBridgeSnapshot,
  );

  const logout = () => {
    postToNative({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider value={{ token, theme, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  }
  return context;
}
