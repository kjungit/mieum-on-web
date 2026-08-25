import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/lib/auth-context";
import { ChildProvider } from "@/lib/child-context";
import { WebViewGate } from "@/components/webview-gate";
import { BottomNav } from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "미음온",
  description: "미음온 앱 웹뷰 콘텐츠",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <WebViewGate>
            <ChildProvider>
              <div className="flex min-h-screen flex-1 flex-col">
                <div className="flex-1">{children}</div>
                <BottomNav />
              </div>
            </ChildProvider>
          </WebViewGate>
        </AuthProvider>
      </body>
    </html>
  );
}
