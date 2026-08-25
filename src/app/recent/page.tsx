"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <main className="flex flex-col gap-4 px-6 py-8">
      <h1 className="text-lg font-semibold">최근 본 제품</h1>

      {views.length === 0 ? (
        <p className="text-sm text-text-secondary">최근 본 제품이 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {views.map((view) => (
            <li key={view.id}>
              <Link
                href={`/products/${view.product.id}`}
                className="flex items-center justify-between rounded-xl bg-background-element px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{view.product.name}</span>
                  <span className="ml-2 text-text-secondary">{view.product.manufacturer}</span>
                </span>
                <span className="text-xs text-text-secondary">
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
