"use client";

import "./globals.css";

// 루트 레이아웃 자체가 실패했을 때의 마지막 안전망. 레이아웃을 대신하므로 html/body를 직접 그린다.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center text-foreground">
        <p className="text-lg font-black tracking-tight">문제가 생겼어요</p>
        <p className="text-sm text-text-secondary">잠시 후 다시 시도해주세요.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white"
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
