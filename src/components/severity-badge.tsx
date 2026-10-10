import { CircleCheck, CircleHelp, CircleSlash, TriangleAlert } from "lucide-react";

import type { Severity } from "@/lib/api/types";
import { GRADE_META, toOverallGrade, type OverallGrade } from "@/lib/grade";

const GRADE_ICON: Record<OverallGrade, typeof CircleCheck> = {
  G: CircleCheck,
  Y: TriangleAlert,
  R: CircleSlash,
  C: CircleHelp,
};

export function GradeBadge({ grade }: { grade: OverallGrade }) {
  const meta = GRADE_META[grade];
  const Icon = GRADE_ICON[grade];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
      style={{ backgroundColor: meta.tintVar, color: meta.colorVar, border: `1px solid ${meta.borderVar}` }}
    >
      <Icon size={14} strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}

// 종합판정(overallGrade + needsReview)을 4단계 배지로 표시.
export function OverallGradeBadge({ severity, needsReview }: { severity: Severity; needsReview: boolean }) {
  return <GradeBadge grade={toOverallGrade(severity, needsReview)} />;
}

// 개별 규칙/성분 판정(서버 Severity 3값)을 표시.
export function SeverityBadge({ severity }: { severity: Severity }) {
  const grade: OverallGrade = severity === "RED" ? "R" : severity === "YELLOW" ? "Y" : "G";
  return <GradeBadge grade={grade} />;
}

export function NeedsReviewBadge() {
  return <GradeBadge grade="C" />;
}
