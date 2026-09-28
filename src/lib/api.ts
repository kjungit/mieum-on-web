import { postToNative } from "@/lib/native-bridge";
import { refreshAccessToken } from "@/lib/token-refresh";

// mieum-on-server의 응답 규약(global.common.ApiResponse / global.exception.ErrorResponse)에 맞춘 타입.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

  if (response.status === 401) {
    if (token) {
      // access 토큰 만료 — 네이티브가 재발급해 준 토큰으로 한 번만 다시 보낸다. 재시도도 401이면 더 반복하지
      // 않는다(그 사이 네이티브가 재발급을 거절해 이미 로그아웃 흐름으로 넘어갔다).
      const refreshedToken = await refreshAccessToken(token);
      if (refreshedToken) {
        response = await send(refreshedToken);
      }
    } else {
      // 토큰이 아예 없으면 재발급할 대상도 없다 — 네이티브가 로그인 흐름으로 유도하도록 알린다.
      postToNative({ type: "AUTH_EXPIRED" });
    }
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
