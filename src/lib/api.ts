import { postToNative } from "@/lib/native-bridge";

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // 만료/무효 토큰 — 네이티브가 재로그인 흐름으로 유도하도록 알림.
    postToNative({ type: "AUTH_EXPIRED" });
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
