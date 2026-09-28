"use client";

import Link from "next/link";
import { Heart, Clock, GitCompareArrows, ShieldAlert, UserRound, LogOut, ChevronRight } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";

const GENDER_LABEL: Record<string, string> = { MALE: "남아", FEMALE: "여아" };

const MENU = [
  { href: "/favorites", label: "즐겨찾기", Icon: Heart },
  { href: "/recent", label: "최근 본 제품", Icon: Clock },
  { href: "/compare", label: "제품 비교함", Icon: GitCompareArrows },
] as const;

export default function MyPage() {
  const { logout } = useAuth();
  const { children: childList, selectedChild, selectChild } = useSelectedChild();

  return (
    <main className="flex flex-col px-5 py-8 pb-16">
      <p className="mb-5 text-[22px] font-black tracking-tight">마이</p>

      <div className="mb-5 flex items-center gap-3 rounded-[18px] border border-background-selected bg-background p-4">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-background-element">
          <UserRound size={20} className="text-text-secondary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">우리 아이 보호자님</p>
          <p className="text-[11px] text-text-secondary">미음:ON과 함께 안심 이유식을 준비해요</p>
        </div>
      </div>

      <p className="mb-2.5 text-[13px] font-bold text-text-secondary">아이</p>
      <div className="mb-5 flex flex-col gap-2">
        {childList.length === 0 ? (
          <Link
            href="/children/new"
            className="rounded-2xl border border-dashed border-background-selected p-4 text-center text-sm text-text-secondary"
          >
            아이를 등록하면 아이 맞춤 분석을 받을 수 있어요. 아이 등록하기 →
          </Link>
        ) : (
          childList.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => {
                selectChild(child.id);
              }}
              className="flex items-center gap-3 rounded-2xl border border-background-selected bg-background p-3.5 text-left"
            >
              <div
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-bold"
                style={{
                  backgroundColor: selectedChild?.id === child.id ? "var(--brand)" : "var(--background-element)",
                  color: selectedChild?.id === child.id ? "#fff" : "var(--foreground)",
                }}
              >
                {child.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">
                  {child.name} · {child.ageMonths}개월
                </p>
                <p className="text-[11px] text-text-secondary">
                  {child.gender ? GENDER_LABEL[child.gender] : "성별 미입력"}
                </p>
              </div>
              <Link
                href={`/children/${child.id}/allergies`}
                onClick={(event) => event.stopPropagation()}
                className="flex-none text-[11px] font-medium text-brand"
              >
                알레르기 관리
              </Link>
            </button>
          ))
        )}
        <Link href="/children" className="self-start text-[11px] font-medium text-brand">
          아이 관리 전체보기 ›
        </Link>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-background-selected bg-background">
        {MENU.map(({ href, label, Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 p-4 ${index < MENU.length - 1 ? "border-b border-background-selected" : ""}`}
          >
            <Icon size={16} className="text-text-secondary" />
            <span className="flex-1 text-[13px] font-medium">{label}</span>
            <ChevronRight size={15} className="text-text-secondary/60" />
          </Link>
        ))}
        {selectedChild ? (
          <Link
            href={`/children/${selectedChild.id}/caution-ingredients`}
            className="flex items-center gap-2.5 border-t border-background-selected p-4"
          >
            <ShieldAlert size={16} className="text-text-secondary" />
            <span className="flex-1 text-[13px] font-medium">주의 성분 직접 지정</span>
            <ChevronRight size={15} className="text-text-secondary/60" />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 border-t border-background-selected p-4 text-left"
        >
          <LogOut size={16} className="text-text-secondary" />
          <span className="flex-1 text-[13px] font-medium">로그아웃</span>
        </button>
      </div>

      <p className="mt-5 text-[10.5px] leading-relaxed text-text-secondary/70">
        본 서비스의 분석 결과는 공개된 자료와 서비스 내부 기준에 따른 참고 정보이며, 의학적 진단·치료·처방을
        대신하지 않습니다.
      </p>
    </main>
  );
}
