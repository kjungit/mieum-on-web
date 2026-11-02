import { AuthProvider } from "@/lib/auth-context";
import { ChildProvider } from "@/lib/child-context";
import { WebViewGate } from "@/components/webview-gate";
import { OnboardingGate } from "@/components/onboarding-gate";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WebViewGate>
        <ChildProvider>
          <OnboardingGate>
            <div className="flex min-h-screen flex-1 flex-col">
              <div className="flex-1">{children}</div>
              <BottomNav />
            </div>
          </OnboardingGate>
        </ChildProvider>
      </WebViewGate>
    </AuthProvider>
  );
}
