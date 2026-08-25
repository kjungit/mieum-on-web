// mieum-on-server 엔티티의 enum과 1:1로 맞춘 타입들.

export type Gender = "MALE" | "FEMALE";
export type AllergyStatus = "HAS" | "NONE" | "UNKNOWN";
export type Severity = "GREEN" | "YELLOW" | "RED";
export type RuleType = "ALLERGY" | "AGE" | "SODIUM" | "SUGAR" | "CAFFEINE" | "ADDITIVE";
export type ProductSource = "SELF" | "MFDS_API";
export type NutritionBasis = "PER_100G" | "PER_SERVING";
export type MatchStatus = "MATCHED" | "UNMATCHED";
export type IngredientType = "ALLERGEN" | "ADDITIVE" | "NUTRIENT" | "ETC";

export interface EvidenceResponse {
  id: number;
  title: string;
  sourceOrg: string;
  sourceUrl: string;
}

export interface NutritionResponse {
  basis: NutritionBasis;
  calories: number | null;
  carbohydrate: number | null;
  sugar: number | null;
  protein: number | null;
  fat: number | null;
  sodium: number | null;
}

export interface ProductSummaryResponse {
  id: number;
  barcode: string | null;
  name: string;
  manufacturer: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  recommendedAgeMonth: number | null;
}

export interface IngredientSummaryResponse {
  id: number;
  name: string;
  type: IngredientType;
}
