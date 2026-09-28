"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Search } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { getCategories, searchProducts, type ProductCategoryResponse } from "@/lib/api/products";
import type { ProductSummaryResponse } from "@/lib/api/types";
import { toggleCompareTray, useCompareTray, COMPARE_TRAY_MAX } from "@/lib/compare-tray";

export default function SearchPage() {
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();
  const compareTray = useCompareTray();

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<ProductSummaryResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // 서버에 월령/알레르기 제외 검색 API가 아직 없어(design-file 578행 메모의 "검색 결과 필터"),
  // 이미 로드된 결과를 프런트에서만 걸러낸다. recommendedAgeMonth가 있는 제품만 판단 가능하다.
  const [ageFilterOn, setAgeFilterOn] = useState(false);
  const [categories, setCategories] = useState<ProductCategoryResponse[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  // 칩을 빠르게 바꾸면 응답 순서가 뒤바뀔 수 있다 — 마지막 요청의 결과만 반영한다.
  const latestRequest = useRef(0);

  useEffect(() => {
    if (!token) return;
    getCategories(token)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [token]);

  // 검색어 없이 카테고리만으로도 둘러볼 수 있고, 둘을 함께 걸 수도 있다(서버가 AND로 처리).
  const runSearch = async (nextKeyword: string, nextCategory: string | null) => {
    if (!token || (!nextKeyword.trim() && !nextCategory)) {
      return;
    }
    const requestId = ++latestRequest.current;
    setIsSearching(true);
    setSearchError(null);
    try {
      const products = await searchProducts(token, {
        keyword: nextKeyword.trim() || undefined,
        category: nextCategory ?? undefined,
      });
      if (requestId !== latestRequest.current) return;
      setResults(products);
      setHasSearched(true);
    } catch {
      if (requestId !== latestRequest.current) return;
      // 옛 결과를 남기면 새로 고른 칩 아래에 이전 카테고리 제품이 그대로 보인다.
      setResults([]);
      setHasSearched(false);
      setSearchError("검색에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      if (requestId === latestRequest.current) setIsSearching(false);
    }
  };

  const handleSearch = () => runSearch(keyword, category);

  const handleCategory = (next: string) => {
    const nextCategory = category === next ? null : next;
    setCategory(nextCategory);
    if (nextCategory || keyword.trim()) {
      void runSearch(keyword, nextCategory);
    } else {
      // 진행 중인 요청의 늦은 응답이 비운 목록을 다시 채우지 않도록 무효화한다.
      latestRequest.current += 1;
      setIsSearching(false);
      setSearchError(null);
      setResults([]);
      setHasSearched(false);
    }
  };

  const visibleResults = useMemo(() => {
    if (!ageFilterOn || !selectedChild) return results;
    return results.filter(
      (product) => product.recommendedAgeMonth == null || product.recommendedAgeMonth <= selectedChild.ageMonths,
    );
  }, [results, ageFilterOn, selectedChild]);

  return (
    <main className="flex flex-col gap-5 px-5 py-7 pb-16">
      <h1 className="text-lg font-bold">제품 검색</h1>

      <div className="flex items-center gap-2 rounded-2xl bg-background-element px-4 py-3">
        <Search size={18} className="flex-none text-text-secondary" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleSearch()}
          placeholder="제품명, 브랜드, 제조사로 검색"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-secondary"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="flex-none rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          검색
        </button>
      </div>

      {categories.length > 0 ? (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5">
          {categories.map((item) => {
            const active = item.category === category;
            return (
              <button
                key={item.category}
                type="button"
                onClick={() => handleCategory(item.category)}
                aria-pressed={active}
                className={`flex-none rounded-full border px-3.5 py-2 text-xs font-medium ${
                  active ? "border-brand bg-brand text-white" : "border-background-selected text-text-secondary"
                }`}
              >
                {item.category} <span className={active ? "text-white/70" : "text-text-secondary/60"}>{item.productCount}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {searchError ? <p className="text-sm text-text-secondary">{searchError}</p> : null}

      {hasSearched ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAgeFilterOn((v) => !v)}
            disabled={!selectedChild}
            className={`rounded-full border px-3 py-2 text-xs font-medium disabled:opacity-40 ${
              ageFilterOn ? "border-brand text-brand" : "border-background-selected text-text-secondary"
            }`}
          >
            {selectedChild ? `${selectedChild.name} 월령에 맞는 제품만` : "우리 아이 월령만"}
          </button>
        </div>
      ) : null}

      {hasSearched && visibleResults.length === 0 ? (
        <p className="text-sm text-text-secondary">검색 결과가 없어요.</p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {visibleResults.map((product) => {
          const inTray = compareTray.includes(product.id);
          return (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-2xl border border-background-selected px-3.5 py-3"
            >
              <div className="h-[52px] w-[52px] flex-none rounded-xl bg-background-element" />
              <Link href={`/products/${product.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{product.name}</p>
                <p className="truncate text-xs text-text-secondary">
                  {product.manufacturer}
                  {product.recommendedAgeMonth ? ` · 권장 ${product.recommendedAgeMonth}개월 이상` : ""}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => toggleCompareTray(product.id)}
                className={`flex-none rounded-full border px-2.5 py-1.5 text-[11px] font-medium ${
                  inTray ? "border-brand text-brand" : "border-background-selected text-text-secondary"
                }`}
              >
                {inTray ? "담김" : "비교"}
              </button>
            </li>
          );
        })}
      </ul>

      {hasSearched && visibleResults.length === 0 ? (
        <Link
          href="/scan"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#16181A] py-4 text-sm font-bold text-white"
        >
          <Camera size={16} />
          원재료 촬영하기
        </Link>
      ) : null}

      {compareTray.length >= 2 ? (
        <Link
          href={`/compare?ids=${compareTray.join(",")}`}
          className="rounded-full bg-brand py-3.5 text-center text-sm font-bold text-white"
        >
          비교함 보기 ({compareTray.length}/{COMPARE_TRAY_MAX})
        </Link>
      ) : null}
    </main>
  );
}
