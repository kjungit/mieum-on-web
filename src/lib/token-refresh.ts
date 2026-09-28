import { isInNativeWebView, onNativeMessage, postToNative } from "@/lib/native-bridge";
import { getBridgeSnapshot } from "@/lib/native-bridge-store";

// 네이티브는 재발급에 실패하면 TOKEN_REFRESH_FAILED를 보내 바로 끝낸다. 이 타임아웃은 그 메시지를 모르는
// 옛 앱 버전이나 메시지가 유실된 경우의 안전장치다 — 무한정 기다리지 않고 원래 401 응답으로 실패시킨다.
const REFRESH_TIMEOUT_MS = 10_000;

let pendingRefresh: Promise<string | null> | null = null;

/**
 * 401을 받은 요청이 재시도에 쓸 새 access 토큰을 얻는다. 토큰 재발급 자체는 네이티브(mieum-on-app)가
 * 한다 — 웹은 refresh 토큰을 갖고 있지 않고, AUTH_EXPIRED를 보내면 네이티브가 재발급한 뒤 TOKEN_REFRESH로
 * 새 토큰을 보내준다.
 *
 * - 요청을 보낸 뒤 그 사이 이미 토큰이 바뀌었으면(다른 요청이 먼저 재발급을 끝냄) 바로 그 토큰을 쓴다.
 * - 동시에 여러 요청이 401을 받아도 AUTH_EXPIRED는 한 번만 보내고 같은 결과를 함께 기다린다.
 * - 네이티브 웹뷰 밖(브라우저에서 개발할 때 등)에서는 재발급해 줄 쪽이 없으므로 null이다.
 */
export function refreshAccessToken(expiredToken: string): Promise<string | null> {
  if (!isInNativeWebView()) {
    return Promise.resolve(null);
  }
  const currentToken = getBridgeSnapshot().token;
  if (currentToken && currentToken !== expiredToken) {
    return Promise.resolve(currentToken);
  }
  if (!pendingRefresh) {
    pendingRefresh = waitForTokenRefresh().finally(() => {
      pendingRefresh = null;
    });
    // 구독을 먼저 건 뒤에 보낸다 — 네이티브가 아주 빨리 응답해도 TOKEN_REFRESH를 놓치지 않는다.
    postToNative({ type: "AUTH_EXPIRED" });
  }
  return pendingRefresh;
}

function waitForTokenRefresh(): Promise<string | null> {
  return new Promise((resolve) => {
    const unsubscribe = onNativeMessage((message) => {
      if (message.type === "TOKEN_REFRESH") {
        clearTimeout(timer);
        unsubscribe();
        resolve(message.token);
      } else if (message.type === "TOKEN_REFRESH_FAILED") {
        clearTimeout(timer);
        unsubscribe();
        resolve(null);
      }
    });
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, REFRESH_TIMEOUT_MS);
  });
}
