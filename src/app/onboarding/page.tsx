"use client";

import { useRouter } from "next/navigation";
import { Stethoscope, PackageSearch } from "lucide-react";

import { completeOnboarding } from "@/lib/onboarding";

const NOTES = [
  {
    Icon: Stethoscope,
    color: "#5B7391",
    title: "의료 진단이 아니에요",
    body: "공개된 기준과 서비스 내부 규칙에 따른 참고 정보입니다. 알레르기가 의심되면 의료 전문가와 상담해 주세요.",
  },
  {
    Icon: PackageSearch,
    color: "#C98A16",
    title: "포장지 표시사항을 함께 확인해 주세요",
    body: "제품이 리뉴얼되면 원재료가 달라질 수 있어요. 구매·섭취 전 실제 포장지를 꼭 확인해 주세요.",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();

  const handleFinish = () => {
    completeOnboarding();
    router.replace("/");
  };

  return (
    <main className="flex min-h-screen flex-col px-6 pb-10 pt-16">
      <span className="text-2xl font-black tracking-tight text-brand">ㅁ:ON</span>
      <p className="mb-3 mt-7 text-[26px] font-black leading-snug tracking-tight">
        우리 아이가 먹는 것을,
        <br />
        먹기 전에 살펴봅니다.
      </p>
      <p className="mb-8 text-[13px] leading-relaxed text-text-secondary">
        아이의 월령과 알레르기를 기준으로 제품의 원재료·영양을 대신 살펴봐요. 시작하기 전에 두 가지만
        알려드릴게요.
      </p>

      <div className="mb-auto flex flex-col gap-3">
        {NOTES.map(({ Icon, color, title, body }) => (
          <div key={title} className="flex gap-3.5 rounded-2xl border border-background-selected bg-background p-4.5">
            <Icon size={22} color={color} className="mt-0.5 flex-none" />
            <div className="flex-1">
              <p className="mb-1.5 text-[13.5px] font-bold">{title}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleFinish}
        className="mt-7 rounded-2xl bg-brand py-4 text-center text-sm font-bold text-white"
      >
        확인했어요, 시작하기
      </button>
      <p className="mt-3 text-center text-[10.5px] text-text-secondary/70">
        이 안내는 처음 한 번만 보여드려요
      </p>
    </main>
  );
}
