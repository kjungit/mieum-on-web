"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { getAllergies, type ChildAllergyResponse } from "@/lib/api/children";
import { listRecentViews, type RecentViewResponse } from "@/lib/api/activity";

export default function Home() {
  const { token } = useAuth();
  const { selectedChild, isLoading } = useSelectedChild();
  const [allergies, setAllergies] = useState<ChildAllergyResponse[]>([]);
  const [recentViews, setRecentViews] = useState<RecentViewResponse[]>([]);

  useEffect(() => {
    if (!token || !selectedChild) {
      Promise.resolve().then(() => setAllergies([]));
      return;
    }
    getAllergies(token, selectedChild.id)
      .then(setAllergies)
      .catch(() => setAllergies([]));
  }, [token, selectedChild]);

  useEffect(() => {
    if (!token) {
      return;
    }
    listRecentViews(token)
      .then((list) => setRecentViews(list.slice(0, 5)))
      .catch(() => setRecentViews([]));
  }, [token]);

  const hasAllergies = allergies.filter((allergy) => allergy.status === "HAS");

  return (
    <main className="flex flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-brand">미음:ON</h1>
        <p className="mt-1 text-sm text-text-secondary">
          우리 아이가 먹는 것, 먹기 전에 살펴보세요.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/search"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-medium text-white"
        >
          🔍 제품 검색
        </Link>
        <Link
          href="/scan"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-background-element py-4 text-sm font-medium"
        >
          📷 원재료 촬영
        </Link>
      </div>

      {!isLoading && !selectedChild ? (
        <Link
          href="/children/new"
          className="rounded-2xl border border-dashed border-background-selected p-4 text-center text-sm text-text-secondary"
        >
          아이를 등록하면 아이 맞춤 분석을 받을 수 있어요. 아이 등록하기 →
        </Link>
      ) : null}

      {selectedChild ? (
        <Link
          href="/children"
          className="rounded-2xl bg-background-element p-4"
        >
          <p className="font-medium">
            {selectedChild.name} · {selectedChild.ageMonths}개월
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {hasAllergies.length > 0
              ? hasAllergies.map((allergy) => allergy.ingredientName).join(", ") + " 알레르기"
              : "등록된 알레르기 없음"}
          </p>
        </Link>
      ) : null}

      {recentViews.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-medium text-text-secondary">최근 본 제품</h2>
          <ul className="space-y-2">
            {recentViews.map((view) => (
              <li key={view.id}>
                <Link
                  href={`/products/${view.product.id}`}
                  className="flex items-center justify-between rounded-xl bg-background-element px-4 py-3 text-sm"
                >
                  <span>{view.product.name}</span>
                  <span className="text-text-secondary">{view.product.manufacturer}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
