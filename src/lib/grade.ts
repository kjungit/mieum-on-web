import type { Severity } from "@/lib/api/types";

// 종합판정 4단계. 개별 규칙 심각도(Severity, 서버 enum 3값)와 달리
// 프런트에서만 쓰는 표시용 타입 — 서버 Severity enum은 확장하지 않는다.
// (mieum-on-app/design-file/MieumON 기획 결정서.dc.html §1: "알레르기 '알 수 없음' 처리" 결정)
export type OverallGrade = "G" | "Y" | "R" | "C";

export const GRADE_META: Record<
  OverallGrade,
  { label: string; short: string; colorVar: string; tintVar: string; borderVar: string }
> = {
  G: { label: "괜찮아요", short: "괜찮아요", colorVar: "var(--grade-g)", tintVar: "var(--grade-g-tint)", borderVar: "var(--grade-g-border)" },
  Y: { label: "주의가 필요해요", short: "주의", colorVar: "var(--grade-y)", tintVar: "var(--grade-y-tint)", borderVar: "var(--grade-y-border)" },
  R: { label: "피하는 것이 좋아요", short: "피하기", colorVar: "var(--grade-r)", tintVar: "var(--grade-r-tint)", borderVar: "var(--grade-r-border)" },
  C: { label: "확인이 필요해요", short: "확인 필요", colorVar: "var(--grade-c)", tintVar: "var(--grade-c-tint)", borderVar: "var(--grade-c-border)" },
};

// 피하기 > 주의 > 확인 필요 > 괜찮음 순으로 더 나쁜 판정이 우선한다.
const GRADE_RANK: Record<OverallGrade, number> = { R: 3, Y: 2, C: 1, G: 0 };

function severityToGrade(severity: Severity): OverallGrade {
  if (severity === "RED") return "R";
  if (severity === "YELLOW") return "Y";
  return "G";
}

/**
 * 서버가 이미 계산한 overallGrade(3값)와 needsReview(알레르기 '알 수 없음' 여부)를 합쳐
 * 4단계 종합등급으로 변환한다. AnalysisResponse.{overallGrade,needsReview}에 대응.
 */
export function toOverallGrade(severity: Severity, needsReview: boolean): OverallGrade {
  const grade = severityToGrade(severity);
  if (needsReview && GRADE_RANK.C > GRADE_RANK[grade]) return "C";
  return grade;
}
