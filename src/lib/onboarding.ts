import { useSyncExternalStore } from "react";

// 최초 1회만 보여주는 면책 안내(온보딩) 완료 여부. 서버엔 저장하지 않는다.
const STORAGE_KEY = "mieum-on:onboarded";

let snapshot: boolean | null = null; // null = 아직 확인 전(서버/최초 렌더)
let initialized = false;
const listeners = new Set<() => void>();

function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") return;
  try {
    snapshot = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    snapshot = true; // storage를 못 쓰는 환경이면 온보딩으로 막지 않는다.
  }
  initialized = true;
}

export function completeOnboarding(): void {
  ensureInitialized();
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // 무시
  }
  snapshot = true;
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void): () => void {
  ensureInitialized();
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): boolean | null {
  ensureInitialized();
  return snapshot;
}

function getServerSnapshot(): boolean | null {
  return null;
}

export function useOnboarded(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
