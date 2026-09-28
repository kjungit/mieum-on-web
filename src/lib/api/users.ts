import { apiFetch } from "@/lib/api";

export type OauthProvider = "KAKAO" | "GOOGLE";

export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  role: "USER" | "ADMIN";
  // 소셜 로그인 전용 계정은 비밀번호가 없다 — 비밀번호 변경 메뉴를 보여줄지 판단한다.
  hasPassword: boolean;
  linkedProviders: OauthProvider[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export function getMe(token: string): Promise<UserResponse> {
  return apiFetch<UserResponse>("/api/users/me", { token });
}

export function updateNickname(token: string, nickname: string): Promise<UserResponse> {
  return apiFetch<UserResponse>("/api/users/me", { method: "PATCH", token, body: { nickname } });
}

/**
 * 성공하면 서버는 이 사용자의 refresh 토큰을 모두 폐기하고 새 토큰 쌍을 돌려준다. refresh 토큰은 네이티브만
 * 보관하므로 호출한 쪽은 받은 토큰을 저장하지 말고 곧바로 SESSION_UPDATED로 네이티브에 넘겨야 한다.
 * 현재 비밀번호가 틀리면 400(U007), 소셜 전용 계정이면 400(U008)이다.
 */
export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/users/me/password", {
    method: "PATCH",
    token,
    body: { currentPassword, newPassword },
  });
}

export function withdraw(token: string): Promise<void> {
  return apiFetch<void>("/api/users/me", { method: "DELETE", token });
}
