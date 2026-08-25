"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
import type { ProductSummaryResponse } from "@/lib/api/types";
import { SeverityBadge, NeedsReviewBadge } from "@/components/severity-badge";
import { EvidenceList } from "@/components/evidence-list";

export default function ProductDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const productId = Number(idParam);
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();

  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [explanation, setExplanation] = useState<AiExplanationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [alternatives, setAlternatives] = useState<ProductSummaryResponse[] | null>(null);

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

  const toggleFavorite = async () => {
    if (!token) {
      return;
    }
    if (isFavorite) {
      await removeFavorite(token, productId);
    } else {
      await addFavorite(token, productId);
    }
    setIsFavorite((current) => !current);
  };

  const handleExplain = async () => {
    if (!token || !selectedChild) {
      return;
    }
    setIsExplaining(true);
    try {
      setExplanation(await explain(token, selectedChild.id, productId));
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAlternatives = async () => {
    if (!token || !selectedChild) {
      return;
    }
    setAlternatives(await getAlternatives(token, selectedChild.id, productId));
  };

  if (!product) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-text-secondary">불러오는 중…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-6 py-8">
      <div>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="mb-4 h-40 w-full rounded-2xl object-cover"
          />
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold">{product.name}</h1>
            <p className="text-sm text-text-secondary">
              {product.manufacturer}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFavorite}
            className="text-2xl"
            aria-label="즐겨찾기"
          >
            {isFavorite ? "⭐" : "☆"}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
          {product.category ? <span className="rounded-full bg-background-element px-2 py-1">{product.category}</span> : null}
          {product.recommendedAgeMonth ? (
            <span className="rounded-full bg-background-element px-2 py-1">
              권장 {product.recommendedAgeMonth}개월 이상
            </span>
          ) : null}
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-secondary">원재료</h2>
        <p className="text-sm">
          {product.ingredients.length > 0
            ? product.ingredients
                .slice()
                .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                .map((ingredient) => ingredient.ingredientName)
                .join(", ")
            : "등록된 원재료 정보가 없어요."}
        </p>
      </section>

      {product.nutrition ? (
        <section>
          <h2 className="mb-2 text-sm font-medium text-text-secondary">
            영양정보 ({product.nutrition.basis === "PER_100G" ? "100g 기준" : "1회 제공량 기준"})
          </h2>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            {[
              ["열량", product.nutrition.calories, "kcal"],
              ["탄수화물", product.nutrition.carbohydrate, "g"],
              ["당류", product.nutrition.sugar, "g"],
              ["단백질", product.nutrition.protein, "g"],
              ["지방", product.nutrition.fat, "g"],
              ["나트륨", product.nutrition.sodium, "mg"],
            ].map(([label, value, unit]) => (
              <div key={label as string} className="rounded-xl bg-background-element p-3">
                <dt className="text-text-secondary">{label}</dt>
                <dd className="font-medium">{value != null ? `${value}${unit}` : "-"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-secondary">아이 맞춤 분석</h2>
        {!selectedChild ? (
          <p className="rounded-2xl bg-background-element p-4 text-sm text-text-secondary">
            분석하려면 아이를 먼저 등록하세요.{" "}
            <Link href="/children/new" className="text-brand underline">
              아이 등록하기
            </Link>
          </p>
        ) : !analysis ? (
          <p className="text-sm text-text-secondary">분석 중…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={analysis.overallGrade} />
              {analysis.needsReview ? <NeedsReviewBadge /> : null}
            </div>

            <div className="rounded-xl bg-background-element p-4 text-sm">
              <p className="font-medium">
                연령 분석 · {analysis.age.childAgeMonths}개월
              </p>
              {analysis.age.manufacturerWarning ? (
                <p className="mt-1 text-red-600">
                  제조사 권장 연령({analysis.age.manufacturerRecommendedAgeMonth}개월 이상)보다 어려요.
                </p>
              ) : (
                <p className="mt-1 text-text-secondary">권장 연령 기준을 충족해요.</p>
              )}
              {analysis.age.ingredientFindings.map((finding) => (
                <div key={finding.ingredientId} className="mt-2">
                  <span className="font-medium">{finding.ingredientName}</span>
                  {finding.minAgeMonth != null ? ` · ${finding.minAgeMonth}개월 이상 권장` : ""}
                  <EvidenceList evidences={finding.evidences} />
                </div>
              ))}
            </div>

            {analysis.allergyWarnings.length > 0 ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm">
                <p className="font-medium text-red-700">🔴 알레르기 주의</p>
                {analysis.allergyWarnings.map((finding) => (
                  <div key={finding.ingredientId} className="mt-2">
                    <span>{finding.ingredientName}</span>
                    <EvidenceList evidences={finding.evidences} />
                  </div>
                ))}
              </div>
            ) : null}

            {analysis.allergyNeedsReview.length > 0 ? (
              <div className="rounded-xl bg-yellow-50 p-4 text-sm">
                <p className="font-medium text-yellow-800">⚠️ 알레르기 확인 필요</p>
                {analysis.allergyNeedsReview.map((finding) => (
                  <div key={finding.ingredientId} className="mt-2">
                    <span>{finding.ingredientName}</span>
                    <EvidenceList evidences={finding.evidences} />
                  </div>
                ))}
              </div>
            ) : null}

            {analysis.cautionFindings.length > 0 ? (
              <div className="rounded-xl bg-background-element p-4 text-sm">
                <p className="font-medium">주의 성분</p>
                {analysis.cautionFindings.map((finding) => (
                  <div key={finding.ingredientId} className="mt-2">
                    <div className="flex items-center gap-2">
                      <span>{finding.ingredientName}</span>
                      <SeverityBadge severity={finding.severity} />
                    </div>
                    {finding.description ? (
                      <p className="mt-1 text-text-secondary">{finding.description}</p>
                    ) : null}
                    <EvidenceList evidences={finding.evidences} />
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleExplain}
              disabled={isExplaining}
              className="rounded-full bg-background-element py-3 text-sm font-medium"
            >
              {isExplaining ? "설명 준비 중…" : "AI 설명 보기"}
            </button>
            {explanation ? (
              <p className="rounded-xl bg-background-element p-4 text-sm">{explanation.explanationText}</p>
            ) : null}

            {analysis.overallGrade === "RED" || analysis.needsReview ? (
              <div>
                <button
                  type="button"
                  onClick={handleAlternatives}
                  className="rounded-full bg-brand py-3 text-sm font-medium text-white"
                >
                  비슷한 제품 찾아보기
                </button>
                {alternatives ? (
                  <ul className="mt-3 space-y-2">
                    {alternatives.length === 0 ? (
                      <p className="text-sm text-text-secondary">추천할 만한 대체 제품이 없어요.</p>
                    ) : (
                      alternatives.map((alt) => (
                        <li key={alt.id}>
                          <Link
                            href={`/products/${alt.id}`}
                            className="block rounded-xl bg-background-element px-4 py-3 text-sm"
                          >
                            {alt.name}
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <p className="text-xs leading-relaxed text-text-secondary">{analysis.disclaimer}</p>
          </div>
        )}
      </section>
    </main>
  );
}
