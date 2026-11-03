"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { isInNativeWebView } from "@/lib/native-bridge";

function subscribe(): () => void {
  return () => {};
}

// 앱 WebView에는 뒤로가기 제스처/버튼 처리가 없어, 공개 문서로 들어오면 빠져나갈 길이 없다.
// 일반 브라우저(스토어 심사 등)에서는 돌아갈 앱 화면이 없으므로 숨긴다.
export function BackToAppLink() {
  const inApp = useSyncExternalStore(subscribe, isInNativeWebView, () => false);
  if (!inApp) {
    return null;
  }
  return (
    <Link href="/mypage" className="mb-6 inline-block text-[13px] font-medium text-text-secondary">
      ‹ 마이페이지로 돌아가기
    </Link>
  );
}
