import type { NextConfig } from "next";

// NEXT_PUBLIC_*는 빌드 시점에 번들에 박힌다. 로컬 .env.local의 에뮬레이터 주소(http://10.0.2.2)가 배포 빌드에 들어가면
// iOS가 평문 http를 막아 앱이 아무것도 못 한다 — 배포 빌드에서 http:// 주소면 빌드를 멈춘다.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (process.env.NODE_ENV === "production" && apiBaseUrl && apiBaseUrl.startsWith("http://")) {
  throw new Error(`NEXT_PUBLIC_API_BASE_URL이 평문 http입니다(${apiBaseUrl}). 배포 빌드는 https 주소여야 합니다.`);
}

const nextConfig: NextConfig = {
  // 로컬 기기/에뮬레이터에서 dev 서버(HMR)에 접근할 때 필요 (Android 에뮬레이터의 호스트 별칭: 10.0.2.2)
  allowedDevOrigins: ["10.0.2.2"],
};

export default nextConfig;
