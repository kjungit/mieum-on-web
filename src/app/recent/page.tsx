"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { listRecentViews, type RecentViewResponse } from "@/lib/api/activity";

export default function RecentViewsPage() {
  const { token } = useAuth();
  const [views, setViews] = useState<RecentViewResponse[]>([]);

  useEffect(() => {
    if (!token) {
      return;
    }
    listRecentViews(token).then(setViews);
  }, [token]);

  return (
    <main className="flex flex-col gap-5 px-5 py-7">
      <h1 className="text-[17px] font-black tracking-tight">최근 본 제품</h1>

      {views.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-background-selected py-14 text-center">
          <Clock size={28} className="text-text-secondary" strokeWidth={1.5} />
          <p className="text-[12.5px] leading-relaxed text-text-secondary">
            아직 본 제품이 없어요.
            <br />
            제품을 검색하거나 촬영해보세요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {views.map((view) => (
            <li key={view.id}>
              <Link
                href={`/products/${view.product.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-background-selected bg-background px-4 py-3.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-bold">{view.product.name}</span>
                  <span className="block truncate text-xs text-text-secondary">{view.product.manufacturer}</span>
                </span>
                <span className="flex-none text-[11px] text-text-secondary">
                  {new Date(view.viewedAt).toLocaleDateString("ko-KR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
