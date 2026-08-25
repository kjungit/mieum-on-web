"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { isInNativeWebView } from "@/lib/native-bridge";

type GateStatus = "unknown" | "in-app" | "browser";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): GateStatus {
  return isInNativeWebView() ? "in-app" : "browser";
}

function getServerSnapshot(): GateStatus {
  return "unknown";
}

// 이 웹 프로젝트는 mieum-on-app의 WebView를 통해서만 접근되도록 설계됨.
// 서버는 웹뷰 여부를 알 수 없으므로 "unknown"으로 렌더하고, 하이드레이션 후
// 클라이언트에서 실제 상태로 동기화한다. 브라우저로 직접 열린 경우 콘텐츠
// 대신 안내 화면을 보여준다.
export function WebViewGate({ children }: { children: ReactNode }) {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (status === "unknown") {
    return null;
  }

  if (status === "browser") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold">앱에서 열어주세요</h1>
        <p className="text-sm text-text-secondary">
          이 페이지는 미음온 앱 안에서만 이용할 수 있어요.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
