import type { AnalysisResponse, NutritionFindingResponse } from "@/lib/api/analysis";
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

const NUTRIENT_LABEL = { SODIUM: "나트륨", SUGAR: "당류" } as const;
const JUDGED_NUTRIENTS = ["SODIUM", "SUGAR"] as const;

export type NutritionVerdict =
  | { kind: "exceeded"; severity: Severity; text: string }
  | { kind: "withinLimits"; text: string }
  | { kind: "notEvaluated"; text: string };

/**
 * 영양 판정을 화면용으로 정리한다. finding이 없다는 것만으로는 "기준 이하"라고 말할 수 없다 — 서버가 실제로
 * 비교한 영양소(evaluatedNutrients)만 기준 이하라고 하고, 나머지는 평가하지 못했다고 밝힌다.
 */
export function nutritionVerdict(analysis: AnalysisResponse): NutritionVerdict {
  if (analysis.nutritionFindings.length > 0) {
    return {
      kind: "exceeded",
      severity: worstSeverity(analysis.nutritionFindings.map((f) => f.severity)),
      text: analysis.nutritionFindings.map((f) => f.description).join(" "),
    };
  }
  if (!analysis.nutrition) {
    return { kind: "notEvaluated", text: "영양정보가 없어 나트륨·당류는 평가하지 않았어요." };
  }
  // 이 필드가 없는 옛 서버 응답이면 비교했는지 알 수 없으므로 "평가 못 함"으로 본다(안전한 쪽).
  const evaluatedList = analysis.evaluatedNutrients ?? [];
  const evaluated = JUDGED_NUTRIENTS.filter((n) => evaluatedList.includes(n));
  const missing = JUDGED_NUTRIENTS.filter((n) => !evaluatedList.includes(n));
  if (missing.length === 0) {
    return { kind: "withinLimits", text: "나트륨·당류 모두 아이 월령 기준을 넘지 않아요." };
  }
  const missingText = `${missing.map((n) => NUTRIENT_LABEL[n]).join("·")}는 표기 정보가 부족하거나 기준과 맞지 않아 평가하지 못했어요.`;
  return {
    kind: "notEvaluated",
    text:
      evaluated.length > 0
        ? `${evaluated.map((n) => NUTRIENT_LABEL[n]).join("·")}는 기준을 넘지 않아요. ${missingText}`
        : missingText,
  };
}
