import { getInitialAuth, onNativeMessage } from "@/lib/native-bridge";
import type { NativeTheme } from "@/types/bridge";

interface BridgeSnapshot {
  token: string | null;
  theme: NativeTheme;
}

const SERVER_SNAPSHOT: BridgeSnapshot = { token: null, theme: "light" };

let snapshot: BridgeSnapshot = SERVER_SNAPSHOT;
let initialized = false;

function ensureInitialized(): void {
  if (initialized) {
    return;
  }
  const init = getInitialAuth();
  snapshot = { token: init?.token ?? null, theme: init?.theme ?? "light" };
  initialized = true;
}

// useSyncExternalStore용 subscribe: 네이티브가 보내는 TOKEN_REFRESH/THEME_CHANGE
// 메시지를 받아 snapshot을 갱신하고 React에 리렌더를 요청한다.
export function subscribeBridge(onStoreChange: () => void): () => void {
  ensureInitialized();
  return onNativeMessage((message) => {
    if (message.type === "TOKEN_REFRESH") {
      snapshot = { ...snapshot, token: message.token };
      onStoreChange();
    } else if (message.type === "THEME_CHANGE") {
      snapshot = { ...snapshot, theme: message.theme };
      onStoreChange();
    }
  });
}

export function getBridgeSnapshot(): BridgeSnapshot {
  ensureInitialized();
  return snapshot;
}

export function getServerBridgeSnapshot(): BridgeSnapshot {
  return SERVER_SNAPSHOT;
}
