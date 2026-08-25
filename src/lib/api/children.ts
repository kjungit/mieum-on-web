import { apiFetch } from "@/lib/api";
import type { AllergyStatus, Gender } from "@/lib/api/types";

export interface ChildResponse {
  id: number;
  name: string;
  birthDate: string;
  ageMonths: number;
  gender: Gender | null;
}

export interface ChildAllergyResponse {
  ingredientId: number;
  ingredientName: string;
  status: AllergyStatus;
}

export interface ChildCautionIngredientResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  createdAt: string;
}

interface ChildWriteRequest {
  name: string;
  birthDate: string;
  gender?: Gender | null;
}

export function registerChild(token: string, request: ChildWriteRequest): Promise<ChildResponse> {
  return apiFetch<ChildResponse>("/api/children", { method: "POST", token, body: request });
}

export function getMyChildren(token: string): Promise<ChildResponse[]> {
  return apiFetch<ChildResponse[]>("/api/children", { token });
}

export function getChild(token: string, childId: number): Promise<ChildResponse> {
  return apiFetch<ChildResponse>(`/api/children/${childId}`, { token });
}

export function updateChild(
  token: string,
  childId: number,
  request: ChildWriteRequest,
): Promise<ChildResponse> {
  return apiFetch<ChildResponse>(`/api/children/${childId}`, { method: "PUT", token, body: request });
}

export function deleteChild(token: string, childId: number): Promise<void> {
  return apiFetch<void>(`/api/children/${childId}`, { method: "DELETE", token });
}

export function upsertAllergy(
  token: string,
  childId: number,
  ingredientId: number,
  status: AllergyStatus,
): Promise<ChildAllergyResponse> {
  return apiFetch<ChildAllergyResponse>(`/api/children/${childId}/allergies/${ingredientId}`, {
    method: "PUT",
    token,
    body: { status },
  });
}

export function getAllergies(token: string, childId: number): Promise<ChildAllergyResponse[]> {
  return apiFetch<ChildAllergyResponse[]>(`/api/children/${childId}/allergies`, { token });
}

export function addCautionIngredient(
  token: string,
  childId: number,
  ingredientId: number,
): Promise<ChildCautionIngredientResponse> {
  return apiFetch<ChildCautionIngredientResponse>(
    `/api/children/${childId}/caution-ingredients/${ingredientId}`,
    { method: "POST", token },
  );
}

export function removeCautionIngredient(
  token: string,
  childId: number,
  ingredientId: number,
): Promise<void> {
  return apiFetch<void>(`/api/children/${childId}/caution-ingredients/${ingredientId}`, {
    method: "DELETE",
    token,
  });
}

export function getCautionIngredients(
  token: string,
  childId: number,
): Promise<ChildCautionIngredientResponse[]> {
  return apiFetch<ChildCautionIngredientResponse[]>(
    `/api/children/${childId}/caution-ingredients`,
    { token },
  );
}
