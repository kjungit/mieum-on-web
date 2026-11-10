import type { ChildResponse } from "@/lib/api/children";
import type { ProfileRelation } from "@/lib/api/types";

// 서버의 Child/children은 역사적 이름이고 실제로는 본인·아이·가족 "프로필"이다. 화면 문구는 전부 프로필 기준으로 쓴다.

export const RELATION_LABEL: Record<ProfileRelation, string> = { SELF: "나", CHILD: "아이", FAMILY: "가족" };

// 성인 프로필도 있어서 "남아/여아"가 아니라 "남/여"다.
export const GENDER_LABEL: Record<string, string> = { MALE: "남", FEMALE: "여" };

/** 36개월 미만은 개월, 그 이상은 만 나이. 성인에게 "420개월"은 뜻이 없다. */
export function ageLabel(ageMonths: number): string {
  return ageMonths < 36 ? `${ageMonths}개월` : `만 ${Math.floor(ageMonths / 12)}세`;
}

/** 분석 기준을 말할 때 쓰는 표현 — "내 기준" / "서준 기준". */
export function basisLabel(profile: ChildResponse): string {
  return profile.relation === "SELF" ? "내 기준" : `${profile.name} 기준`;
}

/** 목록·칩에 보이는 이름. 본인 프로필은 닉네임 대신 "나"로 보여준다. */
export function displayName(profile: ChildResponse): string {
  return profile.relation === "SELF" ? "나" : profile.name;
}
