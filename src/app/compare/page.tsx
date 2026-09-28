"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { compareProducts, type AnalysisResponse } from "@/lib/api/analysis";
import { OverallGradeBadge } from "@/components/severity-badge";
import { RadarChart, type RadarSeries } from "@/components/radar-chart";
import { removeFromCompareTray, useCompareTray } from "@/lib/compare-tray";
import { GRADE_META, toOverallGrade } from "@/lib/grade";
import { nutritionBasisLabel, worstSeverity } from "@/lib/nutrition";

const SERIES_COLORS = ["#1F7A5E", "#2F6BD8"];

function allergyScore(result: AnalysisResponse): number {
  if (result.allergyWarnings.length > 0) return 0;
  if (result.allergyNeedsReview.length > 0) return 0.5;
  return 1;
}

// 서버는 제조사 권장연령 미달을 RED로 본다. 성분별 연령 규칙(예: 꿀)도 함께 반영한다.
function ageScore(result: AnalysisResponse): number {
  if (result.age.manufacturerWarning || result.age.ingredientFindings.some((f) => f.severity === "RED")) return 0;
  if (result.age.ingredientFindings.some((f) => f.severity === "YELLOW")) return 0.5;
  return 1;
}

function cautionScore(result: AnalysisResponse): number {
  const worst = worstSeverity(result.cautionFindings.map((f) => f.severity));
  const ruleScore = worst === "RED" ? 0 : worst === "YELLOW" ? 0.5 : 1;
  return Math.min(ruleScore, parentCautionPenalty(result));
}

// 서버가 출처 기반 영양 임계치(나트륨·당류, 월령별)로 판정한 결과를 쓴다. 영양정보가 없는 제품은 평가하지
// 않은 것이라 "안전"(1)이 아니라 중간값으로 둔다.
function nutritionScore(result: AnalysisResponse): number {
  if (!result.nutrition) return 0.5;
  const worst = worstSeverity(result.nutritionFindings.map((f) => f.severity));
  return worst === "RED" ? 0 : worst === "YELLOW" ? 0.5 : 1;
}

// 보호자가 직접 지정한 주의 성분도 주의 축에 반영한다(서버와 같이 최소 YELLOW).
function parentCautionPenalty(result: AnalysisResponse): number {
  return result.parentCautionFindings.length > 0 ? 0.5 : 1;
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();
  const compareTray = useCompareTray();

  const idsParam = searchParams.get("ids");
  const productIds = idsParam
    ? idsParam.split(",").map(Number).filter((v) => !Number.isNaN(v))
    : compareTray;

  // 결과를 요청한 제품 목록과 함께 둔다 — 제품을 뺀 직후 옛 결과가 순서만 밀려 다른 제품 카드에 붙지 않도록,
  // 지금 목록과 같은 요청의 결과만 보여준다.
  const [comparison, setComparison] = useState<{ key: string; results: AnalysisResponse[] } | null>(null);
  const [compareError, setCompareError] = useState(false);
  const productKey = productIds.join(",");
  const results = comparison?.key === productKey ? comparison.results : [];

  // 제품 상세의 "비교함 보기"는 ?ids=로 연다. 이때 화면은 URL 기준이라 비교함만 고치면 아무것도 바뀌지 않으므로
  // URL에서도 뺀다. 토글이 아니라 제거라서, 비교함에 없던 제품이 거꾸로 담기지도 않는다.
  const handleRemove = (productId: number) => {
    removeFromCompareTray(productId);
    if (idsParam) {
      const remaining = productIds.filter((id) => id !== productId);
      router.replace(remaining.length > 0 ? `/compare?ids=${remaining.join(",")}` : "/compare");
    }
  };

  useEffect(() => {
    if (!token || !selectedChild || productIds.length < 2) {
      return;
    }
    let cancelled = false;
    Promise.resolve().then(() => setCompareError(false));
    compareProducts(token, selectedChild.id, productIds)
      .then((next) => {
        if (!cancelled) setComparison({ key: productKey, results: next });
      })
      .catch(() => {
        if (!cancelled) setCompareError(true);
      });
    return () => {
      cancelled = true;
    };
    // productIds는 매 렌더마다 새 배열이라 join한 값(productKey)으로만 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedChild, productKey]);

  if (!selectedChild) {
    return (
      <main className="px-6 py-8">
        <p className="rounded-2xl bg-background-element p-4 text-sm text-text-secondary">
          제품을 비교하려면 아이를 먼저 등록하세요.{" "}
          <Link href="/children/new" className="text-brand underline">
            아이 등록하기
          </Link>
        </p>
      </main>
    );
  }

  if (productIds.length >= 2 && results.length < 2) {
    return (
      <main className="px-6 py-16 text-center">
        <p className="text-[12.5px] text-text-secondary">
          {compareError ? "비교 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요." : "비교하는 중…"}
        </p>
      </main>
    );
  }

  if (productIds.length < 2) {
    return (
      <main className="flex flex-col items-center px-6 py-16 text-center">
        <p className="mb-5 whitespace-pre-line text-[12.5px] leading-relaxed text-text-secondary">
          {`비교하려면 제품 2개가 필요해요.\n지금 ${productIds.length}개 담겨 있어요.`}
        </p>
        <Link href="/search" className="w-full max-w-xs rounded-2xl bg-brand py-3.5 text-center text-[13px] font-bold text-white">
          제품 찾아보기
        </Link>
      </main>
    );
  }

  const series: RadarSeries[] = results.map((result, index) => ({
    name: result.productName,
    color: SERIES_COLORS[index % SERIES_COLORS.length],
    fill: `${SERIES_COLORS[index % SERIES_COLORS.length]}22`,
    values: [allergyScore(result), ageScore(result), nutritionScore(result), cautionScore(result)],
  }));

  const rows: [string, (result: AnalysisResponse) => string][] = [
    // 제품마다 영양 표기 기준(100g·1회 제공량·총 내용량)이 달라 수치만 나란히 두면 오해할 수 있다.
    ["영양 기준", (result) => (result.nutrition ? nutritionBasisLabel(result.nutrition) : "정보 없음")],
    ["나트륨", (result) => (result.nutrition?.sodium != null ? `${result.nutrition.sodium}mg` : "-")],
    ["당류", (result) => (result.nutrition?.sugar != null ? `${result.nutrition.sugar}g` : "-")],
    ["단백질", (result) => (result.nutrition?.protein != null ? `${result.nutrition.protein}g` : "-")],
    [
      "알레르기",
      (result) =>
        result.allergyWarnings.length > 0
          ? result.allergyWarnings.map((f) => f.ingredientName).join(", ")
          : "없음",
    ],
  ];

  return (
    <main className="flex flex-col gap-3.5 px-5 py-6 pb-16">
      <div className="flex gap-2">
        {productIds.slice(0, 2).map((id, index) => {
          const result = results[index];
          const grade = result ? toOverallGrade(result.overallGrade, result.needsReview) : null;
          return (
            <div key={id} className="flex flex-1 flex-col gap-2 rounded-2xl border border-background-selected bg-background p-3.5">
              <div className="h-[52px] rounded-[11px] bg-background-element" />
              <span className="text-[12.5px] font-bold leading-snug">{result?.productName ?? "…"}</span>
              {grade ? (
                <span
                  className="w-fit rounded-lg px-2.5 py-1 text-[10.5px] font-bold"
                  style={{ backgroundColor: GRADE_META[grade].tintVar, color: GRADE_META[grade].colorVar }}
                >
                  {GRADE_META[grade].short}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="text-left text-[10.5px] font-medium text-text-secondary/70"
              >
                비교함에서 제거
              </button>
            </div>
          );
        })}
      </div>

      <RadarChart series={series} />

      <div className="overflow-hidden rounded-[18px] border border-background-selected bg-background">
        <div className="flex items-center gap-2 border-b border-background-selected px-3.5 py-3">
          <span className="w-[78px] flex-none text-[11.5px] font-medium text-text-secondary">종합</span>
          {results.map((result, index) => (
            <OverallGradeBadge key={index} severity={result.overallGrade} needsReview={result.needsReview} />
          ))}
        </div>
        {rows.map(([label, getValue]) => (
          <div key={label} className="flex items-center gap-2 border-b border-background-selected px-3.5 py-3 last:border-b-0">
            <span className="w-[78px] flex-none text-[11.5px] font-medium text-text-secondary">{label}</span>
            {results.map((result, index) => (
              <span key={index} className="flex-1 rounded-lg bg-background-element px-2 py-1.5 text-center text-[11.5px] font-bold">
                {getValue(result)}
              </span>
            ))}
          </div>
        ))}
      </div>

      <p className="px-0.5 text-[10.5px] leading-relaxed text-text-secondary/70">
        비교 결과도 {selectedChild.name} 기준입니다. 등급이 같아도 근거 항목은 다를 수 있어요.
      </p>
    </main>
  );
}
