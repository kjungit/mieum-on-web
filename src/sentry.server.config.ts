import * as Sentry from "@sentry/nextjs";

// Next 서버(SSR·라우트 핸들러) 쪽. 이 앱은 거의 클라이언트 렌더라 이벤트가 드물지만 /privacy·/terms 같은 공개 페이지가 있다.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "local",
  tracesSampleRate: 0,
});
