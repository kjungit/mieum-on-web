"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { compareProducts, type AnalysisResponse } from "@/lib/api/analysis";
import { OverallGradeBadge } from "@/components/severity-badge";
import { RadarChart, type RadarSeries } from "@/components/radar-chart";
import { toggleCompareTray, useCompareTray } from "@/lib/compare-tray";
import { GRADE_META, toOverallGrade } from "@/lib/grade";

const SERIES_COLORS = ["#1F7A5E", "#2F6BD8"];

function allergyScore(result: AnalysisResponse): number {
  if (result.allergyWarnings.length > 0) return 0;
  if (result.allergyNeedsReview.length > 0) return 0.5;
  return 1;
}

function ageScore(result: AnalysisResponse): number {
  return result.age.manufacturerWarning ? 0.35 : 1;
}

function cautionScore(result: AnalysisResponse): number {
  const worst = result.cautionFindings.reduce<"RED" | "YELLOW" | "GREEN">((acc, f) => {
    if (f.severity === "RED") return "RED";
    if (f.severity === "YELLOW" && acc !== "RED") return "YELLOW";
    return acc;
  }, "GREEN");
  return worst === "RED" ? 0 : worst === "YELLOW" ? 0.5 : 1;
}

// 영유아 영양 임계치가 아직 서버에 없어(기획 결정서 §5 미결) 절대 기준 대신
// 비교 대상 사이의 상대값(나트륨+당류 가중합)으로만 안전도를 근사한다.
function nutritionScores(results: AnalysisResponse[]): number[] {
  const loads = results.map((r) => (r.nutrition?.sodium ?? 0) + (r.nutrition?.sugar ?? 0) * 4);
  const max = Math.max(...loads, 0);
  if (max === 0) return results.map(() => 1);
  return loads.map((load) => 1 - load / max);
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();
  const compareTray = useCompareTray();

  const idsParam = searchParams.get("ids");
  const productIds = idsParam
    ? idsParam.split(",").map(Number).filter((v) => !Number.isNaN(v))
    : compareTray;

  const [results, setResults] = useState<AnalysisResponse[]>([]);

  useEffect(() => {
    if (!token || !selectedChild || productIds.length < 2) {
      return;
    }
    compareProducts(token, selectedChild.id, productIds).then(setResults);
    // productIds는 매 렌더마다 새 배열이라 join한 값으로만 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedChild, productIds.join(",")]);

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

  if (productIds.length < 2 || results.length < 2) {
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

  const nScores = nutritionScores(results);
  const series: RadarSeries[] = results.map((result, index) => ({
    name: result.productName,
    color: SERIES_COLORS[index % SERIES_COLORS.length],
    fill: `${SERIES_COLORS[index % SERIES_COLORS.length]}22`,
    values: [allergyScore(result), ageScore(result), nScores[index], cautionScore(result)],
  }));

  const rows: [string, (result: AnalysisResponse) => string][] = [
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
                onClick={() => toggleCompareTray(id)}
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
