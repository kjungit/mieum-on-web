"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { getProductDetail, type ProductDetailResponse } from "@/lib/api/products";
import { addFavorite, listFavorites, removeFavorite, upsertRecentView } from "@/lib/api/activity";
import {
  analyze,
  explain,
  getAlternatives,
  type AiExplanationResponse,
  type AnalysisResponse,
} from "@/lib/api/analysis";
import type { EvidenceResponse, ProductSummaryResponse } from "@/lib/api/types";
import { GradeBadge } from "@/components/severity-badge";
import { EvidenceSheet } from "@/components/evidence-sheet";
import { toggleCompareTray, useCompareTray, COMPARE_TRAY_MAX } from "@/lib/compare-tray";
import { GRADE_META, severityToGrade, toOverallGrade, worseGrade, type OverallGrade } from "@/lib/grade";
import { nutritionBasisLabel, nutritionFindingEvidences, worstSeverity } from "@/lib/nutrition";

interface AnalysisRow {
  key: string;
  label: string;
  grade: OverallGrade;
  text: string;
  evidences: EvidenceResponse[];
}

function buildAnalysisRows(analysis: AnalysisResponse): AnalysisRow[] {
  const allergyGrade: OverallGrade =
    analysis.allergyWarnings.length > 0 ? "R" : analysis.allergyNeedsReview.length > 0 ? "C" : "G";
  const allergyText =
    analysis.allergyWarnings.length > 0
      ? `${analysis.allergyWarnings.map((f) => f.ingredientName).join(", ")} 성분이 들어있어요.`
      : analysis.allergyNeedsReview.length > 0
        ? `${analysis.allergyNeedsReview.map((f) => f.ingredientName).join(", ")} 성분의 알레르기 여부가 확인되지 않았어요.`
        : "등록된 알레르기 성분이 발견되지 않았어요.";

  // 서버는 제조사 권장연령 미달을 RED로 판정한다(AnalysisService.computeOverallGrade). 성분별 연령 규칙
  // (예: 12개월 미만 꿀)도 종합등급에 들어가므로, 이 행에 보이지 않으면 종합등급만 RED이고 이유는 안 보인다.
  const cautionSeverityRank: Record<string, number> = { RED: 2, YELLOW: 1, GREEN: 0 };
  const ageFindings = analysis.age.ingredientFindings;
  const worstAgeFinding = ageFindings.reduce<"RED" | "YELLOW" | "GREEN">(
    (worst, f) => (cautionSeverityRank[f.severity] > cautionSeverityRank[worst] ? f.severity : worst),
    "GREEN",
  );
  const ageGrade: OverallGrade =
    analysis.age.manufacturerWarning || worstAgeFinding === "RED" ? "R" : worstAgeFinding === "YELLOW" ? "Y" : "G";
  const ageMessages: string[] = [];
  if (analysis.age.manufacturerWarning) {
    ageMessages.push(`제조사 권장 연령(${analysis.age.manufacturerRecommendedAgeMonth}개월 이상)보다 어려요.`);
  }
  if (ageFindings.length > 0) {
    ageMessages.push(
      `${ageFindings.map((f) => (f.minAgeMonth != null ? `${f.ingredientName}(${f.minAgeMonth}개월 이상)` : f.ingredientName)).join(", ")} 성분은 아직 이른 월령이에요.`,
    );
  }
  const ageText =
    ageMessages.length > 0 ? ageMessages.join(" ") : `권장 연령 기준을 충족해요 · ${analysis.age.childAgeMonths}개월`;

  const worstCaution = analysis.cautionFindings.reduce<"RED" | "YELLOW" | "GREEN">(
    (worst, f) => (cautionSeverityRank[f.severity] > cautionSeverityRank[worst] ? f.severity : worst),
    "GREEN",
  );
  const cautionGrade: OverallGrade = worstCaution === "RED" ? "R" : worstCaution === "YELLOW" ? "Y" : "G";
  const cautionText =
    analysis.cautionFindings.length > 0
      ? `${analysis.cautionFindings.map((f) => f.ingredientName).join(", ")} 성분을 한 번 더 확인해보세요.`
      : "별도로 확인할 주의 성분이 없어요.";

  // 보호자가 직접 지정한 성분은 근거 문서가 없는 보호자 판단이라 서버도 최소 YELLOW로만 올린다.
  const parentCautionRows: AnalysisRow[] =
    analysis.parentCautionFindings.length > 0
      ? [
          {
            key: "parentCaution",
            label: "직접 지정한 주의 성분",
            grade: "Y",
            text: `보호자님이 지정한 ${analysis.parentCautionFindings.map((f) => f.ingredientName).join(", ")} 성분이 들어있어요.`,
            evidences: [],
          },
        ]
      : [];

  const nutritionSeverity = worstSeverity(analysis.nutritionFindings.map((f) => f.severity));
  const nutritionRow: AnalysisRow = {
    key: "nutrition",
    label: "영양",
    grade: nutritionSeverity === "RED" ? "R" : nutritionSeverity === "YELLOW" ? "Y" : "G",
    text:
      analysis.nutritionFindings.length > 0
        ? analysis.nutritionFindings.map((f) => f.description).join(" ")
        : analysis.nutrition
          ? "나트륨·당류가 아이 월령 기준을 넘지 않아요."
          : "영양정보가 없어 나트륨·당류는 평가하지 않았어요.",
    evidences: nutritionFindingEvidences(analysis.nutritionFindings),
  };

  return [
    {
      key: "allergy",
      label: "알레르기",
      grade: allergyGrade,
      text: allergyText,
      evidences: [...analysis.allergyWarnings, ...analysis.allergyNeedsReview].flatMap((f) => f.evidences),
    },
    {
      key: "age",
      label: "연령",
      grade: ageGrade,
      text: ageText,
      evidences: analysis.age.ingredientFindings.flatMap((f) => f.evidences),
    },
    {
      key: "caution",
      label: "주의 성분",
      grade: cautionGrade,
      text: cautionText,
      evidences: analysis.cautionFindings.flatMap((f) => f.evidences),
    },
    ...parentCautionRows,
    nutritionRow,
  ];
}

export default function ProductDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const productId = Number(idParam);
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();
  const compareTray = useCompareTray();

  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [explanation, setExplanation] = useState<AiExplanationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [alternatives, setAlternatives] = useState<ProductSummaryResponse[] | null>(null);
  const [activeRow, setActiveRow] = useState<AnalysisRow | null>(null);

  useEffect(() => {
    if (!token || Number.isNaN(productId)) {
      return;
    }
    getProductDetail(token, productId).then(setProduct);
    upsertRecentView(token, productId).catch(() => {});
    listFavorites(token)
      .then((favorites) => setIsFavorite(favorites.some((favorite) => favorite.product.id === productId)))
      .catch(() => {});
  }, [token, productId]);

  useEffect(() => {
    if (!token || !selectedChild || Number.isNaN(productId)) {
      Promise.resolve().then(() => setAnalysis(null));
      return;
    }
    analyze(token, selectedChild.id, productId).then(setAnalysis);
    Promise.resolve().then(() => {
      setExplanation(null);
      setAlternatives(null);
    });
  }, [token, selectedChild, productId]);

  const analysisRows = useMemo(() => (analysis ? buildAnalysisRows(analysis) : []), [analysis]);
  const overallGrade = analysis ? toOverallGrade(analysis.overallGrade, analysis.needsReview) : null;
  const overallMeta = overallGrade ? GRADE_META[overallGrade] : null;
  const inCompareTray = compareTray.includes(productId);

  const toggleFavorite = async () => {
    if (!token) return;
    try {
      if (isFavorite) {
        await removeFavorite(token, productId);
      } else {
        await addFavorite(token, productId);
      }
      setIsFavorite((current) => !current);
    } catch {
      // 처음 목록 조회가 실패해 상태가 어긋났을 수 있다 — 서버 기준으로 다시 맞춘다.
      listFavorites(token)
        .then((favorites) => setIsFavorite(favorites.some((favorite) => favorite.product.id === productId)))
        .catch(() => {});
    }
  };

  const handleExplain = async () => {
    if (!token || !selectedChild) return;
    setIsExplaining(true);
    try {
      setExplanation(await explain(token, selectedChild.id, productId));
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAlternatives = async () => {
    if (!token || !selectedChild) return;
    setAlternatives(await getAlternatives(token, selectedChild.id, productId));
  };

  if (!product) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-text-secondary">불러오는 중…</p>
      </main>
    );
  }

  // 원재료 색은 성분마다 그 성분에 걸린 판정 중 가장 나쁜 것으로 칠한다. 행 등급을 그대로 쓰면 행 안의 다른
  // 성분 등급(예: 제조사 권장연령 경고)이 번지고, 나중에 처리한 행이 더 가벼운 색으로 덮어쓴다.
  const flaggedGradeByIngredient = new Map<string, OverallGrade>();
  const flag = (name: string, grade: OverallGrade) => {
    if (grade === "G") return;
    const current = flaggedGradeByIngredient.get(name);
    flaggedGradeByIngredient.set(name, current ? worseGrade(current, grade) : grade);
  };
  if (analysis) {
    analysis.allergyWarnings.forEach((f) => flag(f.ingredientName, "R"));
    analysis.allergyNeedsReview.forEach((f) => flag(f.ingredientName, "C"));
    analysis.age.ingredientFindings.forEach((f) => flag(f.ingredientName, severityToGrade(f.severity)));
    analysis.cautionFindings.forEach((f) => flag(f.ingredientName, severityToGrade(f.severity)));
    // 보호자 지정 주의 성분은 서버와 같이 YELLOW로 본다.
    analysis.parentCautionFindings.forEach((f) => flag(f.ingredientName, "Y"));
  }

  return (
    <main className="flex flex-col pb-10">
      <div className="px-5 pt-6">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="mb-4 h-40 w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="mb-4 h-40 w-full rounded-2xl bg-background-element" />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-snug">{product.name}</h1>
            <p className="mt-1 text-xs text-text-secondary">
              {product.manufacturer}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
              {product.category ? <span>{product.category}</span> : null}
              {product.recommendedAgeMonth ? <span>· 권장 {product.recommendedAgeMonth}개월 이상</span> : null}
              {product.barcode ? <span className="font-mono text-[10.5px] opacity-70">{product.barcode}</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label="즐겨찾기"
            aria-pressed={isFavorite}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-background-selected"
          >
            <Star
              size={17}
              fill={isFavorite ? "var(--grade-y)" : "none"}
              color={isFavorite ? "var(--grade-y)" : "var(--foreground)"}
            />
          </button>
        </div>
      </div>

      {!selectedChild ? (
        <div className="mx-5 mt-5 rounded-2xl bg-background-element p-4 text-sm text-text-secondary">
          분석하려면 아이를 먼저 등록하세요.{" "}
          <Link href="/children/new" className="text-brand underline">
            아이 등록하기
          </Link>
        </div>
      ) : !analysis ? (
        <p className="mx-5 mt-5 text-sm text-text-secondary">분석 중…</p>
      ) : (
        <>
          {overallGrade && overallMeta ? (
            <div className="px-5 pt-5">
              <div
                className="rounded-[20px] p-5"
                style={{ backgroundColor: overallMeta.tintVar, border: `1px solid ${overallMeta.borderVar}` }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <GradeBadge grade={overallGrade} />
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: overallMeta.colorVar }}>
                  {explanation
                    ? explanation.explanationText
                    : `${selectedChild.name} 기준으로 종합 판정했어요. 자세한 설명이 궁금하면 AI 설명을 확인해보세요.`}
                </p>
                <button
                  type="button"
                  onClick={handleExplain}
                  disabled={isExplaining}
                  className="mt-3 border-t pt-3 text-left text-[11px] font-medium"
                  style={{ borderColor: overallMeta.borderVar, color: overallMeta.colorVar }}
                >
                  {isExplaining ? "AI 설명 준비 중…" : explanation ? "AI 설명 다시 보기" : "AI 설명 보기 ›"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="px-5 pt-6">
            <p className="mb-2.5 text-[15px] font-bold tracking-tight">분석 항목 {analysisRows.length}가지</p>
            <div className="overflow-hidden rounded-[18px] border border-background-selected bg-background">
              {analysisRows.map((row, index) => {
                const meta = GRADE_META[row.grade];
                return (
                  <div
                    key={row.key}
                    className={`flex items-start gap-3 p-4 ${index < analysisRows.length - 1 ? "border-b border-background-selected" : ""}`}
                  >
                    <span
                      className="mt-0.5 h-2.5 w-2.5 flex-none rounded-full"
                      style={{ backgroundColor: meta.colorVar }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[13px] font-bold">{row.label}</span>
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10.5px] font-medium"
                          style={{ backgroundColor: meta.tintVar, color: meta.colorVar }}
                        >
                          {meta.short}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-text-secondary">{row.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveRow(row)}
                      className="flex-none pt-0.5 text-[11px] font-medium text-brand"
                    >
                      근거 ›
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <section className="px-5 pt-6">
        <p className="mb-1 text-[15px] font-bold tracking-tight">원재료 {product.ingredients.length}개</p>
        <p className="mb-3 text-[11px] leading-relaxed text-text-secondary">
          표시 순서는 함량 순입니다.
          {selectedChild ? ` 색이 있는 성분은 ${selectedChild.name} 기준 확인이 필요한 성분이에요.` : ""}
        </p>
        {product.ingredients.length === 0 ? (
          <p className="text-sm text-text-secondary">등록된 원재료 정보가 없어요.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {product.ingredients
              .slice()
              .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((ingredient) => {
                const grade = flaggedGradeByIngredient.get(ingredient.ingredientName);
                const meta = grade ? GRADE_META[grade] : null;
                return (
                  <span
                    key={ingredient.id}
                    className="rounded-[10px] px-3 py-2 text-xs font-medium"
                    style={
                      meta
                        ? { backgroundColor: meta.tintVar, color: meta.colorVar, border: `1px solid ${meta.borderVar}` }
                        : { backgroundColor: "var(--background-element)", color: "var(--foreground)" }
                    }
                  >
                    {ingredient.ingredientName}
                  </span>
                );
              })}
          </div>
        )}
      </section>

      {product.nutrition ? (
        <section className="px-5 pt-6">
          <p className="mb-3 text-[15px] font-bold tracking-tight">
            영양정보{" "}
            <span className="text-[11px] font-normal text-text-secondary">
              {nutritionBasisLabel(product.nutrition)}
            </span>
          </p>
          <div className="overflow-hidden rounded-[18px] border border-background-selected bg-background px-4">
            {[
              ["열량", product.nutrition.calories, "kcal"],
              ["탄수화물", product.nutrition.carbohydrate, "g"],
              ["당류", product.nutrition.sugar, "g"],
              ["단백질", product.nutrition.protein, "g"],
              ["지방", product.nutrition.fat, "g"],
              ["나트륨", product.nutrition.sodium, "mg"],
            ].map(([label, value, unit], index, all) => (
              <div
                key={label as string}
                className={`flex items-center justify-between py-3 ${index < all.length - 1 ? "border-b border-background-selected" : ""}`}
              >
                <span className="text-[12.5px] font-medium text-text-secondary">{label}</span>
                <span className="text-[13px] font-bold">{value != null ? `${value}${unit}` : "-"}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 등급이 RED이거나 알레르기 '알 수 없음'이 있으면 대체 제품을 권한다. 4단계 등급으로 판단하면
          YELLOW + 확인 필요인 제품이 "Y"로 합쳐져 빠진다. */}
      {analysis && (analysis.overallGrade === "RED" || analysis.needsReview) ? (
        <section className="px-5 pt-6">
          <button
            type="button"
            onClick={handleAlternatives}
            className="w-full rounded-2xl bg-brand py-3.5 text-sm font-bold text-white"
          >
            비슷한 제품 찾아보기
          </button>
          {alternatives ? (
            <ul className="mt-3 flex flex-col gap-2">
              {alternatives.length === 0 ? (
                <p className="text-sm text-text-secondary">추천할 만한 대체 제품이 없어요.</p>
              ) : (
                alternatives.map((alt) => (
                  <li key={alt.id}>
                    <Link
                      href={`/products/${alt.id}`}
                      className="block rounded-2xl border border-background-selected bg-background px-4 py-3 text-sm font-medium"
                    >
                      {alt.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="flex gap-2 px-5 pt-6">
        <button
          type="button"
          onClick={() => toggleCompareTray(productId)}
          className={`flex-1 rounded-[14px] border py-3.5 text-[12.5px] font-bold ${
            inCompareTray ? "border-brand text-brand" : "border-background-selected text-text-secondary"
          }`}
        >
          {inCompareTray ? "비교함에서 빼기" : "비교함 담기"}
        </button>
        <Link
          href={`/compare?ids=${compareTray.join(",")}`}
          className="flex-1 rounded-[14px] bg-[#16181A] py-3.5 text-center text-[12.5px] font-bold text-white"
        >
          비교함 보기 ({compareTray.length}/{COMPARE_TRAY_MAX})
        </Link>
      </section>

      {analysis ? (
        <p className="mx-5 mt-6 text-[10.5px] leading-relaxed text-text-secondary/70">{analysis.disclaimer}</p>
      ) : null}

      {activeRow ? (
        <EvidenceSheet
          open
          onClose={() => setActiveRow(null)}
          grade={activeRow.grade}
          title={activeRow.label}
          description={activeRow.text}
          evidences={activeRow.evidences}
        />
      ) : null}
    </main>
  );
}
