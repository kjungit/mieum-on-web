import { apiFetch } from "@/lib/api";
import type { EvidenceResponse, NutritionResponse, RuleType, Severity } from "@/lib/api/types";
import type { ProductSummaryResponse } from "@/lib/api/types";

export interface IngredientAgeFindingResponse {
  ingredientId: number;
  ingredientName: string;
  minAgeMonth: number | null;
  severity: Severity;
  evidences: EvidenceResponse[];
}

export interface AgeAnalysisResponse {
  childAgeMonths: number;
  manufacturerRecommendedAgeMonth: number | null;
  manufacturerWarning: boolean;
  ingredientFindings: IngredientAgeFindingResponse[];
}

export interface AllergyFindingResponse {
  ingredientId: number;
  ingredientName: string;
  evidences: EvidenceResponse[];
}

export interface CautionFindingResponse {
  ingredientId: number;
  ingredientName: string;
  ruleType: RuleType;
  severity: Severity;
  thresholdValue: string | null;
  description: string | null;
  evidences: EvidenceResponse[];
}

export interface AnalysisResponse {
  productName: string;
  childName: string;
  overallGrade: Severity;
  needsReview: boolean;
  age: AgeAnalysisResponse;
  allergyWarnings: AllergyFindingResponse[];
  allergyNeedsReview: AllergyFindingResponse[];
  cautionFindings: CautionFindingResponse[];
  nutrition: NutritionResponse | null;
  disclaimer: string;
}

export interface AiExplanationResponse {
  id: number;
  explanationText: string;
  cached: boolean;
  createdAt: string;
}

export function analyze(token: string, childId: number, productId: number): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>(`/api/analysis?childId=${childId}&productId=${productId}`, { token });
}

export function explain(token: string, childId: number, productId: number): Promise<AiExplanationResponse> {
  return apiFetch<AiExplanationResponse>(
    `/api/analysis/explanation?childId=${childId}&productId=${productId}`,
    { token },
  );
}

export function compareProducts(
  token: string,
  childId: number,
  productIds: number[],
): Promise<AnalysisResponse[]> {
  const query = new URLSearchParams({ childId: String(childId) });
  productIds.forEach((id) => query.append("productIds", String(id)));
  return apiFetch<AnalysisResponse[]>(`/api/analysis/compare?${query.toString()}`, { token });
}

export function getAlternatives(
  token: string,
  childId: number,
  productId: number,
): Promise<ProductSummaryResponse[]> {
  return apiFetch<ProductSummaryResponse[]>(
    `/api/analysis/alternatives?childId=${childId}&productId=${productId}`,
    { token },
  );
}
