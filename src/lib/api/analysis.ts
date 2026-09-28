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

// 보호자가 아이에게 직접 지정한 주의 성분이 들어 있는 경우. 근거 문서가 없는 보호자 판단이라 심각도·근거가 없다.
export interface ParentCautionFindingResponse {
  ingredientId: number;
  ingredientName: string;
}

export type ThresholdBasis = "PER_100KCAL" | "PER_100G" | "PER_SERVING";

// 나트륨/당류를 영양 임계치(출처 기반)로 판정한 결과.
export interface NutritionFindingResponse {
  nutrient: "SODIUM" | "SUGAR";
  basis: ThresholdBasis;
  measuredValue: number;
  thresholdValue: number;
  severity: Severity;
  description: string;
  sourceOrg: string;
  sourceTitle: string;
  sourceUrl: string | null;
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
  parentCautionFindings: ParentCautionFindingResponse[];
  nutritionFindings: NutritionFindingResponse[];
  nutrition: NutritionResponse | null;
  disclaimer: string;
}

// 원재료 촬영 분석. 제품 분석과 같은 규칙이지만 제조사 권장연령·영양정보가 없고, 매칭 실패 원재료를 함께 준다.
// 매칭 실패가 있거나 원재료를 하나도 읽지 못했으면 needsReview=true다.
export interface ScanAnalysisResponse {
  scanId: number;
  childName: string;
  overallGrade: Severity;
  needsReview: boolean;
  age: AgeAnalysisResponse;
  allergyWarnings: AllergyFindingResponse[];
  allergyNeedsReview: AllergyFindingResponse[];
  cautionFindings: CautionFindingResponse[];
  parentCautionFindings: ParentCautionFindingResponse[];
  unmatchedTexts: string[];
  disclaimer: string;
}

export interface AiExplanationResponse {
  // 서버가 캐시 저장에 실패한 드문 경우 null이다(설명 자체는 정상).
  id: number | null;
  explanationText: string;
  cached: boolean;
  createdAt: string;
}

export function analyze(token: string, childId: number, productId: number): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>(`/api/analysis?childId=${childId}&productId=${productId}`, { token });
}

export function analyzeScan(token: string, childId: number, scanId: number): Promise<ScanAnalysisResponse> {
  return apiFetch<ScanAnalysisResponse>(`/api/analysis/scans/${scanId}?childId=${childId}`, { token });
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
