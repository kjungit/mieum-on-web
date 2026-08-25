export type NativeTheme = "light" | "dark";
export type NativePlatform = "ios" | "android";

export interface NativeBridgeInit {
  token: string | null;
  theme: NativeTheme;
  platform: NativePlatform;
}

export type NativeToWebMessage =
  | { type: "TOKEN_REFRESH"; token: string }
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
