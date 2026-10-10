"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Scan, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/search", label: "탐색", Icon: Search },
  { href: "/scan", label: "촬영", Icon: Scan },
  { href: "/mypage", label: "마이", Icon: UserRound },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/onboarding") {
    return null;
  }

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-background-selected bg-background">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              active ? "text-brand" : "text-text-secondary"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
