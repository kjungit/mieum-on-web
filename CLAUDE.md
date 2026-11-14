@AGENTS.md

## 오류 추적 (Sentry)

`@sentry/nextjs`. `src/instrumentation-client.ts`(브라우저), `src/instrumentation.ts` + `src/sentry.server.config.ts`(Next 서버)에서 `NEXT_PUBLIC_SENTRY_DSN`이 있을 때만 켠다. 성능 추적·세션 리플레이는 0 — 무료 플랜 한도를 오류에 쓰고, 건강 정보가 보이는 화면을 녹화하지 않는다. `error.tsx`/`global-error.tsx`가 `captureException`을 직접 부른다(Next error boundary는 자동 전송이 아니다). `withSentryConfig`(소스맵 업로드)는 `SENTRY_AUTH_TOKEN`이 생기면 붙인다 — 그 전까지 스택트레이스는 압축된 코드 기준이다.
