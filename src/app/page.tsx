"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Camera, Star } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { getAllergies, type ChildAllergyResponse } from "@/lib/api/children";
import { addFavorite, listFavorites, removeFavorite, listRecentViews, type RecentViewResponse } from "@/lib/api/activity";
import { analyze, type AnalysisResponse } from "@/lib/api/analysis";
import { useCompareTray, COMPARE_TRAY_MAX } from "@/lib/compare-tray";
import { GRADE_META, toOverallGrade, type OverallGrade } from "@/lib/grade";

export default function Home() {
  const { token } = useAuth();
  const { children: childList, selectedChild, selectChild, isLoading } = useSelectedChild();
  const compareTray = useCompareTray();
  const [allergies, setAllergies] = useState<ChildAllergyResponse[]>([]);
  const [recentViews, setRecentViews] = useState<RecentViewResponse[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [recentAnalysis, setRecentAnalysis] = useState<Record<number, AnalysisResponse>>({});

  useEffect(() => {
    if (!token || !selectedChild) {
      Promise.resolve().then(() => setAllergies([]));
      return;
    }
    getAllergies(token, selectedChild.id)
      .then(setAllergies)
      .catch(() => setAllergies([]));
  }, [token, selectedChild]);

  useEffect(() => {
    if (!token) return;
    listRecentViews(token)
      .then((list) => setRecentViews(list.slice(0, 5)))
      .catch(() => setRecentViews([]));
    listFavorites(token)
      .then((list) => setFavoriteIds(new Set(list.map((f) => f.product.id))))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token || !selectedChild || recentViews.length === 0) {
      Promise.resolve().then(() => setRecentAnalysis({}));
      return;
    }
    // 아이를 바꾸면 이전 아이의 늦게 도착한 결과가 새 아이 목록에 섞이지 않게 버린다. 한 제품 분석이 실패해도
    // (삭제된 제품 등) 나머지 등급은 보여준다.
    let cancelled = false;
    Promise.allSettled(
      recentViews.map((view) =>
        analyze(token, selectedChild.id, view.product.id).then((result) => [view.product.id, result] as const),
      ),
    ).then((settled) => {
      if (cancelled) return;
      const entries = settled.flatMap((outcome) => (outcome.status === "fulfilled" ? [outcome.value] : []));
      setRecentAnalysis(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [token, selectedChild, recentViews]);

  const hasAllergies = allergies.filter((allergy) => allergy.status === "HAS");
  const unknownAllergies = allergies.filter((allergy) => allergy.status === "UNKNOWN");

  const childTags = useMemo(() => {
    // 색은 CSS 변수라 "var(--x)1a"처럼 알파값을 이어 붙일 수 없다 — 등급별 tint 토큰을 쓴다.
    const tags: { label: string; grade: OverallGrade }[] = hasAllergies.map((a) => ({
      label: `${a.ingredientName} 있음`,
      grade: "R",
    }));
    unknownAllergies.forEach((a) => tags.push({ label: `${a.ingredientName} 알 수 없음`, grade: "C" }));
    if (tags.length === 0) tags.push({ label: "등록된 알레르기 없음", grade: "G" });
    return tags;
  }, [hasAllergies, unknownAllergies]);

  const toggleFavorite = async (productId: number) => {
    if (!token) return;
    const isFav = favoriteIds.has(productId);
    try {
      if (isFav) {
        await removeFavorite(token, productId);
      } else {
        await addFavorite(token, productId);
      }
      setFavoriteIds((current) => {
        const next = new Set(current);
        if (isFav) next.delete(productId);
        else next.add(productId);
        return next;
      });
    } catch {
      // 처음 목록 조회가 실패해 상태가 어긋났을 수 있다 — 서버 기준으로 다시 맞춘다.
      listFavorites(token)
        .then((list) => setFavoriteIds(new Set(list.map((f) => f.product.id))))
        .catch(() => {});
    }
  };

  return (
    <main className="px-5 pb-16 pt-14">
      <div className="mb-5 flex items-baseline gap-1.5">
        <span className="text-xl font-black tracking-tight text-brand">ㅁ:ON</span>
        <span className="text-[11px] text-text-secondary">미음:ON</span>
      </div>

      <p className="mb-5 whitespace-pre-line text-2xl font-bold leading-snug tracking-tight">
        {"우리 아이가 먹는 것,\n먹기 전에 살펴보세요."}
      </p>

      {!isLoading && childList.length > 0 ? (
        <div className="mb-3.5 flex gap-2 overflow-x-auto pb-0.5">
          {childList.map((child) => {
            const active = child.id === selectedChild?.id;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => selectChild(child.id)}
                className={`flex flex-none items-center gap-2.5 rounded-full py-2 pl-2 pr-3.5 ${
                  active ? "bg-[#16181A] text-white" : "border border-background-selected bg-background text-foreground"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    active ? "bg-white/20 text-white" : "bg-background-element text-text-secondary"
                  }`}
                >
                  {child.name.slice(0, 1)}
                </span>
                <span className="flex flex-col items-start">
                  <span className="text-[13px] font-bold leading-none">{child.name}</span>
                  <span className={`text-[11px] leading-none ${active ? "text-white/70" : "text-text-secondary"}`}>
                    {child.ageMonths}개월
                  </span>
                </span>
              </button>
            );
          })}
          <Link
            href="/children/new"
            className="flex flex-none items-center rounded-full border border-dashed border-background-selected px-4 text-xs font-medium text-text-secondary"
          >
            아이 추가
          </Link>
        </div>
      ) : null}

      {!isLoading && !selectedChild ? (
        <Link
          href="/children/new"
          className="mb-4 block rounded-2xl border border-dashed border-background-selected p-4 text-center text-sm text-text-secondary"
        >
          아이를 등록하면 아이 맞춤 분석을 받을 수 있어요. 아이 등록하기 →
        </Link>
      ) : null}

      {selectedChild ? (
        <div className="mb-4 rounded-[18px] border border-background-selected bg-background p-4.5 shadow-[0_2px_10px_rgba(22,24,26,0.03)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-bold">{selectedChild.name} 기준으로 분석해요</span>
            <Link href="/children" className="text-[11px] font-medium text-brand">
              알레르기 관리 ›
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {childTags.map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium"
                style={{ backgroundColor: GRADE_META[tag.grade].tintVar, color: GRADE_META[tag.grade].colorVar }}
              >
                <span className="block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GRADE_META[tag.grade].colorVar }} />
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex gap-2.5">
        <Link href="/search" className="flex flex-1 flex-col gap-6 rounded-[18px] bg-brand p-4 pt-4.5 text-white">
          <Search size={26} strokeWidth={1.8} />
          <div>
            <div className="text-[15px] font-bold">제품 검색</div>
            <div className="text-[11.5px] text-white/70">제품명 · 브랜드 · 제조사</div>
          </div>
        </Link>
        <Link href="/scan" className="flex flex-1 flex-col gap-6 rounded-[18px] bg-[#16181A] p-4 pt-4.5 text-white">
          <Camera size={26} strokeWidth={1.8} />
          <div>
            <div className="text-[15px] font-bold">원재료 촬영</div>
            <div className="text-[11.5px] text-white/60">DB에 없는 제품도 분석</div>
          </div>
        </Link>
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[15px] font-bold tracking-tight">최근 본 제품</span>
        <Link href="/recent" className="text-[11px] font-medium text-brand">
          전체보기 ›
        </Link>
      </div>
      {recentViews.length === 0 ? (
        <p className="mb-4 text-sm text-text-secondary">아직 살펴본 제품이 없어요.</p>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {recentViews.map((view) => {
            const result = recentAnalysis[view.product.id];
            const grade = result ? toOverallGrade(result.overallGrade, result.needsReview) : null;
            const isFav = favoriteIds.has(view.product.id);
            return (
              <div
                key={view.id}
                className="flex items-center gap-3 rounded-2xl border border-background-selected bg-background p-3"
              >
                <Link href={`/products/${view.product.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-14 w-14 flex-none rounded-xl bg-background-element" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[11px] text-text-secondary">{view.product.brand ?? view.product.manufacturer}</span>
                    <span className="truncate text-[13.5px] font-bold">{view.product.name}</span>
                  </div>
                </Link>
                <div className="flex flex-none flex-col items-end gap-2">
                  {grade ? (
                    <span
                      className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: GRADE_META[grade].tintVar, color: GRADE_META[grade].colorVar }}
                    >
                      {GRADE_META[grade].short}
                    </span>
                  ) : null}
                  <button type="button" onClick={() => toggleFavorite(view.product.id)} aria-label="즐겨찾기">
                    <Star size={15} fill={isFav ? "var(--grade-y)" : "none"} color={isFav ? "var(--grade-y)" : "var(--text-secondary)"} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/compare"
        className="flex items-center gap-2.5 rounded-2xl border border-background-selected bg-background px-4 py-3.5"
      >
        <span className="flex-1 text-[13px] font-bold">제품 비교함</span>
        <span className="text-[11px] font-medium text-text-secondary">
          {compareTray.length}/{COMPARE_TRAY_MAX}
        </span>
        <span className="text-text-secondary/60">›</span>
      </Link>

      <p className="mt-5 text-[10.5px] leading-relaxed text-text-secondary/70">
        ※ 이 정보는 의료적 진단을 대신하지 않습니다. 구매·섭취 전 제품 포장지의 표시사항을 반드시 확인해
        주세요.
      </p>
    </main>
  );
}
