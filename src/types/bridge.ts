export type NativeTheme = "light" | "dark";
export type NativePlatform = "ios" | "android";

export interface NativeBridgeInit {
  token: string | null;
  theme: NativeTheme;
  platform: NativePlatform;
}

export type NativeToWebMessage =
  | { type: "TOKEN_REFRESH"; token: string }
  // AUTH_EXPIRED에 대한 응답으로, 네이티브가 재발급을 하지 못했을 때 온다(오프라인·서버 장애·세션 거절).
  | { type: "TOKEN_REFRESH_FAILED" }
  | { type: "THEME_CHANGE"; theme: NativeTheme }
  // 원재료 촬영(OCR): 카메라는 네이티브가 촬영하고, 업로드 API 호출은 웹이 담당한다.
  | { type: "IMAGE_CAPTURED"; dataUrl: string }
  | { type: "CAMERA_CANCELLED" }
  | { type: "CAMERA_ERROR"; message: string };

export type WebToNativeMessage =
  | { type: "LOGOUT" }
  | { type: "AUTH_EXPIRED" }
  | { type: "NAVIGATE_NATIVE"; route: string }
  | { type: "REQUEST_CAMERA" }
  // 비밀번호 변경처럼 웹이 서버에서 새 토큰 쌍을 직접 받으면 네이티브에 넘긴다. refresh 토큰은 네이티브만
  // 보관하므로 웹은 저장하지 않는다. 네이티브는 저장한 뒤 TOKEN_REFRESH로 새 access 토큰을 돌려준다.
  | { type: "SESSION_UPDATED"; accessToken: string; refreshToken: string };

declare global {
  interface Window {
    __NATIVE_BRIDGE__?: NativeBridgeInit;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
