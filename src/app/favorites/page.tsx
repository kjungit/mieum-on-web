"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <main className="flex flex-col gap-4 px-6 py-8">
      <h1 className="text-lg font-semibold">즐겨찾기</h1>

      {favorites.length === 0 ? (
        <p className="text-sm text-text-secondary">즐겨찾기한 제품이 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {favorites.map((favorite) => (
            <li
              key={favorite.id}
              className="flex items-center justify-between rounded-xl bg-background-element px-4 py-3 text-sm"
            >
              <Link href={`/products/${favorite.product.id}`} className="flex-1">
                <p className="font-medium">{favorite.product.name}</p>
                <p className="text-text-secondary">{favorite.product.manufacturer}</p>
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(favorite.product.id)}
                className="text-xs text-red-600"
              >
                제거
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
