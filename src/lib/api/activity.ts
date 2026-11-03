import { apiFetch } from "@/lib/api";
import type { ProductSummaryResponse, SliceResponse } from "@/lib/api/types";

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

export function listFavorites(token: string, page = 0): Promise<SliceResponse<FavoriteResponse>> {
  return apiFetch<SliceResponse<FavoriteResponse>>(`/api/favorites?page=${page}`, { token });
}

// "이 제품을 즐겨찾기했는지" 표시용. 목록은 페이지로 나뉘어 첫 페이지 밖의 제품을 알 수 없어 ID 전체를 따로 받는다.
export function listFavoriteProductIds(token: string): Promise<number[]> {
  return apiFetch<number[]>("/api/favorites/product-ids", { token });
}

export function upsertRecentView(token: string, productId: number): Promise<RecentViewResponse> {
  return apiFetch<RecentViewResponse>(`/api/recent-views/${productId}`, { method: "PUT", token });
}

export function listRecentViews(token: string): Promise<RecentViewResponse[]> {
  return apiFetch<RecentViewResponse[]>("/api/recent-views", { token });
}
