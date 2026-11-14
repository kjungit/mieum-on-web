"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

// 화면을 그리다 예외가 나면 Next 기본(영어) 오류 화면 대신 이걸 보여준다. (app) 레이아웃 안이라 하단 탭은 남는다.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Next의 error boundary는 자동으로 Sentry에 보내지 않는다.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center gap-3 px-6 py-20 text-center">
      <p className="text-lg font-black tracking-tight">문제가 생겼어요</p>
      <p className="text-sm text-text-secondary">잠시 후 다시 시도해주세요.</p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={reset} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white">
          다시 시도
        </button>
        <Link href="/" className="rounded-full border border-background-selected px-5 py-2.5 text-sm font-bold">
          홈으로
        </Link>
      </div>
    </main>
  );
}
