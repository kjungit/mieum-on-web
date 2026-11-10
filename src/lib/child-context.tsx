"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/auth-context";
import { getMyChildren, type ChildResponse } from "@/lib/api/children";
import { errorMessage } from "@/lib/api";
import { LoadError } from "@/components/load-error";

const STORAGE_KEY = "mieum-on:selectedChildId";

interface ChildContextValue {
  children: ChildResponse[];
  selectedChild: ChildResponse | null;
  isLoading: boolean;
  selectChild: (childId: number) => void;
  refresh: () => Promise<void>;
}

const ChildContext = createContext<ChildContextValue | null>(null);

function readStoredChildId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function writeStoredChildId(childId: number): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, String(childId));
}

export function ChildProvider({ children: node }: { children: ReactNode }) {
  const { token } = useAuth();
  const [childList, setChildList] = useState<ChildResponse[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setChildList([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await getMyChildren(token);
      setChildList(list);
      setSelectedChildId((current) => {
        if (current && list.some((child) => child.id === current)) {
          return current;
        }
        const stored = readStoredChildId();
        if (stored && list.some((child) => child.id === stored)) {
          return stored;
        }
        return list[0]?.id ?? null;
      });
    } catch (error) {
      setLoadError(errorMessage(error, "프로필 정보를 불러오지 못했어요."));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void refresh();
    });
  }, [refresh]);

  const selectChild = (childId: number) => {
    setSelectedChildId(childId);
    writeStoredChildId(childId);
  };

  const selectedChild = childList.find((child) => child.id === selectedChildId) ?? null;

  // 프로필 목록은 거의 모든 화면이 쓴다. 처음 불러오기에 실패한 채로 두면 프로필이 없는 것처럼 "프로필 등록하기"가
  // 떠서, 이미 등록한 사용자가 같은 프로필을 또 등록하게 된다 — 화면 대신 다시 시도를 보여준다.
  if (loadError && childList.length === 0) {
    return (
      <main className="px-5 py-10">
        <LoadError message={loadError} onRetry={() => void refresh()} />
      </main>
    );
  }

  return (
    <ChildContext.Provider value={{ children: childList, selectedChild, isLoading, selectChild, refresh }}>
      {node}
    </ChildContext.Provider>
  );
}

export function useSelectedChild(): ChildContextValue {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error("useSelectedChild는 ChildProvider 내부에서만 사용할 수 있습니다.");
  }
  return context;
}
