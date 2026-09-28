import type { NutritionFindingResponse } from "@/lib/api/analysis";
import type { EvidenceResponse, NutritionResponse, Severity } from "@/lib/api/types";

// 영양 수치는 기준(분모)을 함께 보여줘야 비교할 수 있다. PER_TOTAL은 총 내용량을 알아야 해석된다.
export function nutritionBasisLabel(nutrition: NutritionResponse): string {
  switch (nutrition.basis) {
    case "PER_100G":
      return "100g 기준";
    case "PER_SERVING":
      return "1회 제공량 기준";
    case "PER_TOTAL":
      return nutrition.totalContent != null
        ? `총 내용량(${nutrition.totalContent}${nutrition.totalContentUnit ?? ""}) 기준`
        : "총 내용량 기준";
  }
}

const SEVERITY_RANK: Record<Severity, number> = { RED: 2, YELLOW: 1, GREEN: 0 };

export function worstSeverity(severities: Severity[]): Severity {
  return severities.reduce<Severity>((worst, s) => (SEVERITY_RANK[s] > SEVERITY_RANK[worst] ? s : worst), "GREEN");
}

// 영양 판정 근거는 임계치 자체의 출처라 EvidenceResponse와 모양이 다르다 — 근거 시트에서 같이 보여주려고 맞춘다.
// id는 서버 근거와 겹치지 않도록 음수로 둔다(목록 key 용도).
export function nutritionFindingEvidences(findings: NutritionFindingResponse[]): EvidenceResponse[] {
  return findings.map((finding, index) => ({
    id: -(index + 1),
    title: finding.sourceTitle,
    sourceOrg: finding.sourceOrg,
    sourceUrl: finding.sourceUrl,
    description: finding.description,
  }));
}
