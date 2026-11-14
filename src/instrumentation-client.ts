import * as Sentry from "@sentry/nextjs";

// 브라우저(WebView) 쪽 오류 추적. DSN이 없으면(로컬) 아무것도 보내지 않는다. 성능 추적·세션 리플레이는 끈다 —
// 무료 플랜 한도를 오류에 쓰고, 화면 녹화는 건강 정보가 보이는 서비스에 맞지 않는다.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "local",
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
