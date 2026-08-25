import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로컬 기기/에뮬레이터에서 dev 서버(HMR)에 접근할 때 필요 (Android 에뮬레이터의 호스트 별칭: 10.0.2.2)
  allowedDevOrigins: ["10.0.2.2"],
};

export default nextConfig;
