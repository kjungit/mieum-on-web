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
  | { type: "REQUEST_CAMERA" };

declare global {
  interface Window {
    __NATIVE_BRIDGE__?: NativeBridgeInit;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}
