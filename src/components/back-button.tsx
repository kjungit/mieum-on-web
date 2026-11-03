"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// 하단 탭에 없는 상세 화면(제품, 촬영 결과, 아이 정보)에서 이전 화면으로 돌아간다. 공유 링크 등으로 바로
// 들어와 되돌아갈 기록이 없으면 fallbackHref로 보낸다.
export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="뒤로 가기"
      className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-text-secondary"
    >
      <ChevronLeft size={22} />
    </button>
  );
}
