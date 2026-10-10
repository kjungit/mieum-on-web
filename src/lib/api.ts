import { postToNative } from "@/lib/native-bridge";
import { refreshAccessToken } from "@/lib/token-refresh";

// mieum-on-server의 응답 규약(global.common.ApiResponse / global.exception.ErrorResponse)에 맞춘 타입.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const MAX_AUTH_RETRIES = 2;

interface ApiSuccessBody<T> {
  success: true;
  data: T;
}

export interface ApiValidationError {
  field: string;
  value: string;
  reason: string;
}

export interface ApiErrorBody {
  status: number;
  code: string;
  message: string;
  errors: ApiValidationError[];
  timestamp: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: ApiValidationError[];

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.status;
    this.code = body.code;
    this.errors = body.errors;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  token?: string | null;
  body?: unknown;
}

export async function apiFetch<T>(
  path: string,
  { token, body, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  }

  // FormData(멀티파트 업로드)는 JSON으로 감싸지 않고, Content-Type도 직접
  // 지정하지 않는다 — 브라우저가 boundary를 포함해 자동으로 설정해야 한다.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const send = (accessToken: string | null | undefined) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await send(token);

  if (response.status === 401 && !token) {
    // 토큰이 아예 없으면 재발급할 대상도 없다 — 네이티브가 로그인 흐름으로 유도하도록 알린다.
    postToNative({ type: "AUTH_EXPIRED" });
  }

  // access 토큰 만료 — 새 토큰으로 다시 보낸다. 첫 재시도는 "이미 다른 요청이 받아 둔 토큰"일 수 있는데, 앱이
  // 오래 백그라운드에 있었다면 그 토큰도 만료됐을 수 있다. 그래서 재시도도 401이면 그 토큰 기준으로 한 번 더
  // 재발급받는다. 무한 반복을 막기 위해 재시도는 최대 MAX_AUTH_RETRIES번이고, 새 토큰을 못 받으면
  // (네이티브가 재발급을 거절·실패) 즉시 멈춘다.
  let usedToken = token;
  for (let retry = 0; response.status === 401 && usedToken && retry < MAX_AUTH_RETRIES; retry++) {
    const refreshedToken = await refreshAccessToken(usedToken);
    if (!refreshedToken || refreshedToken === usedToken) {
      break;
    }
    usedToken = refreshedToken;
    response = await send(usedToken);
  }

  if (!response.ok) {
    const errorBody = (await response.json()) as ApiErrorBody;
    throw new ApiError(errorBody);
  }

  // 삭제 등 ResponseEntity<Void> 엔드포인트는 204/본문 없음으로 응답한다.
  if (response.status === 204) {
    return undefined as T;
  }
  const rawText = await response.text();
  if (!rawText) {
    return undefined as T;
  }

  const successBody = JSON.parse(rawText) as ApiSuccessBody<T>;
  return successBody.data;
}
