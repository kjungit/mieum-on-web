"use client";

import Link from "next/link";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";

const LINKS = [
  { href: "/children", label: "아이 관리" },
  { href: "/favorites", label: "즐겨찾기" },
  { href: "/recent", label: "최근 본 제품" },
  { href: "/scans", label: "촬영 기록" },
];

export default function MyPage() {
  const { logout } = useAuth();
  const { selectedChild } = useSelectedChild();

  return (
    <main className="flex flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">마이</h1>
        {selectedChild ? (
          <p className="mt-1 text-sm text-text-secondary">
            {selectedChild.name} · {selectedChild.ageMonths}개월 보호자님
          </p>
        ) : null}
      </div>

      <ul className="space-y-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-xl bg-background-element px-4 py-3 text-sm font-medium"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-background-selected py-3 text-sm font-medium text-text-secondary"
      >
        로그아웃
      </button>
    </main>
  );
}
