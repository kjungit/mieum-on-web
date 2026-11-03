import Link from "next/link";

import { BackToAppLink } from "@/components/back-to-app-link";

// 앱스토어·플레이스토어 심사와 일반 브라우저에서도 열려야 하는 공개 문서용 레이아웃.
// (app) 그룹의 WebViewGate를 거치지 않는다.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-[14px] leading-relaxed [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-2">
      <BackToAppLink />
      {children}
      <p className="mt-12 border-t border-black/10 pt-4 text-[12px] text-text-secondary">
        <Link href="/privacy" className="underline">
          개인정보처리방침
        </Link>
        {" · "}
        <Link href="/terms" className="underline">
          이용약관
        </Link>
      </p>
    </main>
  );
}
