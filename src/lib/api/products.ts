import { apiFetch } from "@/lib/api";
import type { NutritionResponse, ProductSource, ProductSummaryResponse } from "@/lib/api/types";

export interface ProductIngredientResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  displayOrder: number | null;
}

export interface ProductDetailResponse extends ProductSummaryResponse {
  source: ProductSource;
  ingredients: ProductIngredientResponse[];
  nutrition: NutritionResponse | null;
}

export function searchProducts(
  token: string,
  params: { keyword?: string; barcode?: string; category?: string } = {},
): Promise<ProductSummaryResponse[]> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.barcode) query.set("barcode", params.barcode);
  if (params.category) query.set("category", params.category);
  const queryString = query.toString();
  return apiFetch<ProductSummaryResponse[]>(`/api/products${queryString ? `?${queryString}` : ""}`, {
    token,
  });
}

export function getProductDetail(token: string, productId: number): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/api/products/${productId}`, { token });
}

export interface ProductCategoryResponse {
  category: string;
  productCount: number;
}

// 실제 등록된 제품에서 모은 카테고리와 그 안의 제품 수. 카테고리명 오름차순이다.
export function getCategories(token: string): Promise<ProductCategoryResponse[]> {
  return apiFetch<ProductCategoryResponse[]>("/api/products/categories", { token });
}
