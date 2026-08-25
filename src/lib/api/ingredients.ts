import { apiFetch } from "@/lib/api";
import type { IngredientSummaryResponse } from "@/lib/api/types";

export function searchIngredients(token: string, name: string): Promise<IngredientSummaryResponse[]> {
  const query = name ? `?name=${encodeURIComponent(name)}` : "";
  return apiFetch<IngredientSummaryResponse[]>(`/api/ingredients${query}`, { token });
}
