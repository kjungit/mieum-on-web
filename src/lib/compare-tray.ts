import { useSyncExternalStore } from "react";

// 제품 상세에서 "비교함 담기"로 최대 2개까지 모아뒀다가 /compare로 넘기는 클라이언트 전용 임시 목록.
// 서버에 저장하지 않고 localStorage에만 둔다.
const STORAGE_KEY = "mieum-on:compare-tray";
const MAX_ITEMS = 2;

let snapshot: number[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function readStorage(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "number") : [];
  } catch {
    return [];
  }
}

function writeStorage(ids: number[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage를 못 쓰는 환경이면 조용히 무시한다.
  }
}

function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") return;
  snapshot = readStorage();
  initialized = true;
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function toggleCompareTray(productId: number): void {
  ensureInitialized();
  const next = snapshot.includes(productId)
    ? snapshot.filter((id) => id !== productId)
    : [...snapshot, productId].slice(-MAX_ITEMS);
  snapshot = next;
  writeStorage(next);
  emit();
}

function subscribe(onStoreChange: () => void): () => void {
  ensureInitialized();
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): number[] {
  ensureInitialized();
  return snapshot;
}

function getServerSnapshot(): number[] {
  return [];
}

export function useCompareTray(): number[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const COMPARE_TRAY_MAX = MAX_ITEMS;
