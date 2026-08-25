"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { searchProducts } from "@/lib/api/products";
import type { ProductSummaryResponse } from "@/lib/api/types";

export default function SearchPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<ProductSummaryResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!token || !keyword.trim()) {
      return;
    }
    setIsSearching(true);
    try {
      const products = await searchProducts(token, { keyword: keyword.trim() });
      setResults(products);
      setSelectedIds([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelect = (productId: number) => {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  return (
    <main className="flex flex-col gap-4 px-6 py-8">
      <h1 className="text-lg font-semibold">제품 검색</h1>

      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleSearch()}
          placeholder="제품명, 브랜드, 제조사로 검색"
          className="flex-1 rounded-xl bg-background-element px-4 py-3 text-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="rounded-xl bg-brand px-4 text-sm font-medium text-white"
        >
          검색
        </button>
      </div>

      {hasSearched && results.length === 0 ? (
        <p className="text-sm text-text-secondary">검색 결과가 없어요.</p>
      ) : null}

      <ul className="space-y-2">
        {results.map((product) => (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-xl bg-background-element px-4 py-3"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(product.id)}
              onChange={() => toggleSelect(product.id)}
            />
            <Link href={`/products/${product.id}`} className="flex-1 text-sm">
              <p className="font-medium">{product.name}</p>
              <p className="text-text-secondary">{product.manufacturer}</p>
            </Link>
          </li>
        ))}
      </ul>

      {selectedIds.length >= 2 ? (
        <button
          type="button"
          onClick={() => router.push(`/compare?ids=${selectedIds.join(",")}`)}
          className="rounded-full bg-brand py-3 text-sm font-medium text-white"
        >
          선택한 {selectedIds.length}개 제품 비교하기
        </button>
      ) : null}
    </main>
  );
}
