"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { listFavorites, removeFavorite, type FavoriteResponse } from "@/lib/api/activity";
import { LoadMoreButton } from "@/components/load-more-button";

export default function FavoritesPage() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    listFavorites(token).then((slice) => {
      setFavorites(slice.items);
      setHasNext(slice.hasNext);
      setPage(0);
    });
  }, [token]);

  const loadMore = async () => {
    if (!token) return;
    setLoadingMore(true);
    try {
      const slice = await listFavorites(token, page + 1);
      // 그사이 지운 항목이 있으면 다음 페이지가 한 칸씩 당겨져 이미 받은 항목이 다시 올 수 있다 — 겹치는 건 뺀다.
      setFavorites((current) => [
        ...current,
        ...slice.items.filter((item) => !current.some((existing) => existing.id === item.id)),
      ]);
      setHasNext(slice.hasNext);
      setPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  // 목록을 처음부터 다시 받으면 펼쳐 둔 페이지가 접힌다 — 지운 항목만 화면에서 뺀다.
  const handleRemove = async (productId: number) => {
    if (!token) {
      return;
    }
    await removeFavorite(token, productId);
    setFavorites((current) => current.filter((favorite) => favorite.product.id !== productId));
  };

  return (
    <main className="flex flex-col gap-5 px-5 py-7">
      <h1 className="text-[17px] font-black tracking-tight">즐겨찾기</h1>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-background-selected py-14 text-center">
          <Star size={28} className="text-text-secondary" strokeWidth={1.5} />
          <p className="text-[12.5px] leading-relaxed text-text-secondary">즐겨찾기한 제품이 없어요.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {favorites.map((favorite) => (
            <li
              key={favorite.id}
              className="flex items-center gap-3 rounded-2xl border border-background-selected bg-background px-4 py-3.5"
            >
              <Link href={`/products/${favorite.product.id}`} className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold">{favorite.product.name}</p>
                <p className="truncate text-xs text-text-secondary">{favorite.product.manufacturer}</p>
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(favorite.product.id)}
                aria-label="즐겨찾기에서 제거"
                className="flex-none rounded-full p-1.5 text-text-secondary"
              >
                <X size={16} strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <LoadMoreButton hasNext={hasNext} loading={loadingMore} onClick={loadMore} />
    </main>
  );
}
