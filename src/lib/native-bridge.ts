import type {
  NativeBridgeInit,
  NativeToWebMessage,
  WebToNativeMessage,
} from "@/types/bridge";

// mieum-on-app이 WebView 로드 전 injectedJavaScriptBeforeContentLoaded로
// window.__NATIVE_BRIDGE__를 주입한다는 계약(아직 네이티브 쪽 미구현) 하에 동작한다.

export function isInNativeWebView(): boolean {
  return typeof window !== "undefined" && window.ReactNativeWebView !== undefined;
}

export function getInitialAuth(): NativeBridgeInit | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.__NATIVE_BRIDGE__ ?? null;
}

export function postToNative(message: WebToNativeMessage): void {
  if (typeof window === "undefined" || !window.ReactNativeWebView) {
    return;
  }
  window.ReactNativeWebView.postMessage(JSON.stringify(message));
}

export function onNativeMessage(
  handler: (message: NativeToWebMessage) => void,
): () => void {
  const listener = (event: MessageEvent | Event) => {
    const data = (event as MessageEvent).data;
    if (typeof data !== "string") {
      return;
    }
    try {
      const parsed = JSON.parse(data) as Partial<NativeToWebMessage>;
      if (parsed && typeof parsed.type === "string") {
        handler(parsed as NativeToWebMessage);
      }
    } catch {
      // 네이티브 브릿지가 아닌 다른 출처의 message 이벤트는 무시한다.
    }
  };

  // iOS는 window로, Android WebView는 document로 message 이벤트를 보낸다.
  window.addEventListener("message", listener);
  document.addEventListener("message", listener);

  return () => {
    window.removeEventListener("message", listener);
    document.removeEventListener("message", listener);
  };
}
