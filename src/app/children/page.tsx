"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { useSelectedChild } from "@/lib/child-context";

const GENDER_LABEL: Record<string, string> = { MALE: "남아", FEMALE: "여아" };

export default function ChildrenPage() {
  const { children: childList, selectedChild, isLoading, selectChild } = useSelectedChild();

  return (
    <main className="flex flex-col px-5 py-8 pb-16">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[22px] font-black tracking-tight">아이 관리</p>
        <Link href="/children/new" className="flex items-center gap-1 text-[12.5px] font-bold text-brand">
          <Plus size={15} />
          아이 추가
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-text-secondary">불러오는 중…</p> : null}

      {!isLoading && childList.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-background-selected p-4 text-center text-sm text-text-secondary">
          아직 등록된 아이가 없어요.
        </p>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {childList.map((child) => (
          <li key={child.id} className="overflow-hidden rounded-2xl border border-background-selected bg-background">
            <button
              type="button"
              onClick={() => selectChild(child.id)}
              className="flex w-full items-center gap-3 p-4 text-left"
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
                <p className="text-[13.5px] font-bold">{child.name}</p>
                <p className="text-[11px] text-text-secondary">
                  {child.ageMonths}개월 {child.gender ? `· ${GENDER_LABEL[child.gender]}` : ""}
                </p>
              </div>
              {selectedChild?.id === child.id ? (
                <span className="flex-none text-[10.5px] font-bold text-brand">선택됨</span>
              ) : (
                <ChevronRight size={16} className="flex-none text-text-secondary/50" />
              )}
            </button>
            <div className="flex gap-4 border-t border-background-selected px-4 py-3 text-[11.5px] font-medium text-brand">
              <Link href={`/children/${child.id}/edit`}>수정</Link>
              <Link href={`/children/${child.id}/allergies`}>알레르기 관리</Link>
              <Link href={`/children/${child.id}/caution-ingredients`}>주의 성분</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
