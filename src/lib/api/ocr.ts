import { apiFetch } from "@/lib/api";
import type { MatchStatus } from "@/lib/api/types";

export interface RawIngredientScanItemResponse {
  id: number;
  rawText: string;
  ingredientId: number | null;
  ingredientName: string | null;
  matchStatus: MatchStatus;
  displayOrder: number | null;
}

export interface RawIngredientScanResponse {
  id: number;
  childId: number | null;
  imageUrl: string;
  ocrRawText: string;
  items: RawIngredientScanItemResponse[];
  createdAt: string;
}

export interface RawIngredientScanSummaryResponse {
  id: number;
  imageUrl: string;
  matchedCount: number;
  unmatchedCount: number;
  createdAt: string;
}

export function createScan(
  token: string,
  image: Blob,
  childId?: number | null,
): Promise<RawIngredientScanResponse> {
  const formData = new FormData();
  formData.append("image", image, "scan.jpg");

  const query = childId ? `?childId=${childId}` : "";
  return apiFetch<RawIngredientScanResponse>(`/api/ocr/scans${query}`, {
    method: "POST",
    token,
    body: formData,
  });
}

export function getMyScans(token: string): Promise<RawIngredientScanSummaryResponse[]> {
  return apiFetch<RawIngredientScanSummaryResponse[]>("/api/ocr/scans", { token });
}

export function getScan(token: string, scanId: number): Promise<RawIngredientScanResponse> {
  return apiFetch<RawIngredientScanResponse>(`/api/ocr/scans/${scanId}`, { token });
}
