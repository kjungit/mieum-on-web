import { apiFetch } from "@/lib/api";
import type { ProductSummaryResponse } from "@/lib/api/types";

export interface FavoriteResponse {
  id: number;
  product: ProductSummaryResponse;
  createdAt: string;
}

export interface RecentViewResponse {
  id: number;
  product: ProductSummaryResponse;
  viewedAt: string;
}

export function addFavorite(token: string, productId: number): Promise<FavoriteResponse> {
  return apiFetch<FavoriteResponse>(`/api/favorites/${productId}`, { method: "POST", token });
}

export function removeFavorite(token: string, productId: number): Promise<void> {
  return apiFetch<void>(`/api/favorites/${productId}`, { method: "DELETE", token });
}

export function listFavorites(token: string): Promise<FavoriteResponse[]> {
  return apiFetch<FavoriteResponse[]>("/api/favorites", { token });
}

export function upsertRecentView(token: string, productId: number): Promise<RecentViewResponse> {
  return apiFetch<RecentViewResponse>(`/api/recent-views/${productId}`, { method: "PUT", token });
}

export function listRecentViews(token: string): Promise<RecentViewResponse[]> {
  return apiFetch<RecentViewResponse[]>("/api/recent-views", { token });
}
