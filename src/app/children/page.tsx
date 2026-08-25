"use client";

import Link from "next/link";

import { useSelectedChild } from "@/lib/child-context";

const GENDER_LABEL: Record<string, string> = { MALE: "남아", FEMALE: "여아" };

export default function ChildrenPage() {
  const { children: childList, selectedChild, isLoading, selectChild } = useSelectedChild();

  return (
    <main className="flex flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">아이 관리</h1>
        <Link href="/children/new" className="text-sm font-medium text-brand">
          + 아이 추가
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-text-secondary">불러오는 중…</p> : null}

      {!isLoading && childList.length === 0 ? (
        <p className="rounded-2xl bg-background-element p-4 text-sm text-text-secondary">
          아직 등록된 아이가 없어요.
        </p>
      ) : null}

      <ul className="space-y-3">
        {childList.map((child) => (
          <li key={child.id} className="rounded-2xl bg-background-element p-4">
            <button
              type="button"
              onClick={() => selectChild(child.id)}
              className="flex w-full items-center justify-between text-left"
            >
              <span>
                <span className="font-medium">{child.name}</span>
                <span className="ml-2 text-sm text-text-secondary">
                  {child.ageMonths}개월 {child.gender ? `· ${GENDER_LABEL[child.gender]}` : ""}
                </span>
              </span>
              {selectedChild?.id === child.id ? (
                <span className="text-xs font-medium text-brand">선택됨</span>
              ) : null}
            </button>
            <div className="mt-3 flex gap-3 text-sm text-brand">
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
