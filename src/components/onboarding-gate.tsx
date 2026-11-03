"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useOnboarded } from "@/lib/onboarding";

const ONBOARDING_PATH = "/onboarding";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const onboarded = useOnboarded();
  const pathname = usePathname();
  const router = useRouter();
  const needsOnboarding = onboarded === false && pathname !== ONBOARDING_PATH;

  useEffect(() => {
    if (needsOnboarding) {
      router.replace(ONBOARDING_PATH);
    }
  }, [needsOnboarding, router]);

  // onboarded === null: localStorage 확인 전(하이드레이션 직후) — 깜빡임 방지로 아무것도 렌더하지 않는다.
  if (onboarded === null || needsOnboarding) {
    return null;
  }

  return <>{children}</>;
}
