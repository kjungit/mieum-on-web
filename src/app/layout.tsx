import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "미음:ON",
  description: "미음:ON 앱 웹뷰 콘텐츠",
  // 앱 WebView 전용 화면이라 검색 노출이 의미 없다. 약관·개인정보처리방침은 링크로만 접근한다.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 앱 WebView 전용: iOS는 16px 미만 입력창에 포커스하면 화면을 확대하고 되돌리지 않는다. 핀치줌도 앱 UI에선 막는다.
  maximumScale: 1,
  userScalable: false,
  // 하단 탭이 iPhone 홈 인디케이터·Android 제스처 바 뒤로 들어가지 않게 safe-area를 받는다(bottom-nav, bottom-sheet).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#14171A" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
