"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { listFavorites, removeFavorite, type FavoriteResponse } from "@/lib/api/activity";

export default function FavoritesPage() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteResponse[]>([]);

  const load = () => {
    if (!token) {
      return;
    }
    listFavorites(token).then(setFavorites);
  };

  useEffect(load, [token]);

  const handleRemove = async (productId: number) => {
    if (!token) {
      return;
    }
    await removeFavorite(token, productId);
    load();
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
    </main>
  );
}
