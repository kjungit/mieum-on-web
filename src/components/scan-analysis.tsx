"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { analyzeScan, type ScanAnalysisResponse } from "@/lib/api/analysis";
import { ApiError } from "@/lib/api";
import { GradeBadge } from "@/components/severity-badge";
import { GRADE_META, severityToGrade, toOverallGrade, type OverallGrade } from "@/lib/grade";

interface Issue {
  key: string;
  grade: OverallGrade;
  text: string;
}

function buildIssues(analysis: ScanAnalysisResponse): Issue[] {
  const issues: Issue[] = [];
  analysis.allergyWarnings.forEach((f) =>
    issues.push({ key: `allergy-${f.ingredientId}`, grade: "R", text: `${f.ingredientName} — 알레르기로 등록된 성분이에요.` }),
  );
  analysis.age.ingredientFindings.forEach((f) =>
    issues.push({
      key: `age-${f.ingredientId}`,
      grade: severityToGrade(f.severity),
      text: `${f.ingredientName} — ${f.minAgeMonth != null ? `${f.minAgeMonth}개월 이상부터 권장해요.` : "아직 이른 월령이에요."}`,
    }),
  );
  analysis.cautionFindings.forEach((f) =>
    issues.push({
      key: `caution-${f.ingredientId}-${f.ruleType}`,
      grade: severityToGrade(f.severity),
      text: `${f.ingredientName} — ${f.description ?? "한 번 더 확인해보세요."}`,
    }),
  );
  analysis.parentCautionFindings.forEach((f) =>
    issues.push({ key: `parent-${f.ingredientId}`, grade: "Y", text: `${f.ingredientName} — 보호자님이 직접 지정한 주의 성분이에요.` }),
  );
  analysis.allergyNeedsReview.forEach((f) =>
    issues.push({ key: `review-${f.ingredientId}`, grade: "C", text: `${f.ingredientName} — 알레르기 여부가 확인되지 않은 성분이에요.` }),
  );
  return issues;
}

/**
 * 원재료 촬영 결과를 지금 선택한 아이 기준으로 분석해 보여준다. 스캔을 찍을 때 고른 아이와 달라도 된다
 * (형제 각각의 알레르기로 같은 원재료를 확인하는 경우).
 */
export function ScanAnalysis({ scanId }: { scanId: number }) {
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();
  const [result, setResult] = useState<{ key: string; analysis: ScanAnalysisResponse } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestKey = selectedChild ? `${scanId}:${selectedChild.id}` : null;
  const analysis = result && result.key === requestKey ? result.analysis : null;

  useEffect(() => {
    if (!token || !selectedChild || !requestKey) return;
    let cancelled = false;
    Promise.resolve().then(() => setError(null));
    analyzeScan(token, selectedChild.id, scanId)
      .then((next) => {
        if (!cancelled) setResult({ key: requestKey, analysis: next });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "분석 결과를 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, selectedChild, scanId, requestKey]);

  if (!selectedChild) {
    return (
      <p className="rounded-2xl bg-background-element p-4 text-sm text-text-secondary">
        아이 기준으로 분석하려면 아이를 먼저 등록하세요.{" "}
        <Link href="/children/new" className="text-brand underline">
          아이 등록하기
        </Link>
      </p>
    );
  }
  if (error) {
    return <p className="rounded-2xl bg-background-element p-4 text-sm text-text-secondary">{error}</p>;
  }
  if (!analysis) {
    return <p className="text-sm text-text-secondary">{selectedChild.name} 기준으로 분석하는 중…</p>;
  }

  const grade = toOverallGrade(analysis.overallGrade, analysis.needsReview);
  const meta = GRADE_META[grade];
  const issues = buildIssues(analysis);
  const noIngredientRead = analysis.needsReview && issues.length === 0 && analysis.unmatchedTexts.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[20px] p-4" style={{ backgroundColor: meta.tintVar, border: `1px solid ${meta.borderVar}` }}>
        <div className="mb-2 flex items-center gap-2">
          <GradeBadge grade={grade} />
          <span className="text-xs text-text-secondary">{analysis.childName} 기준</span>
        </div>
        {issues.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {issues.map((issue) => (
              <li key={issue.key} className="flex items-start gap-2 text-[12.5px] leading-relaxed">
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                  style={{ backgroundColor: GRADE_META[issue.grade].colorVar }}
                />
                <span>{issue.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] leading-relaxed" style={{ color: meta.colorVar }}>
            {noIngredientRead
              ? "사진에서 원재료를 읽지 못했어요. 원재료 표시가 잘 보이게 다시 촬영해주세요."
              : "읽은 원재료 중에는 확인이 필요한 성분이 없어요."}
          </p>
        )}
      </div>

      {analysis.unmatchedTexts.length > 0 ? (
        <p className="rounded-2xl p-3.5 text-xs leading-relaxed" style={{ backgroundColor: "var(--grade-c-tint)", color: "var(--grade-c)" }}>
          성분 DB에 없어 판정하지 못한 원재료가 있어요: {analysis.unmatchedTexts.join(", ")}. 알레르기 유발 성분이 섞여
          있을 수 있으니 포장지를 직접 확인해주세요.
        </p>
      ) : null}

      <p className="text-[10.5px] leading-relaxed text-text-secondary/70">{analysis.disclaimer}</p>
    </div>
  );
}
