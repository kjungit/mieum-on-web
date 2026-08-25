"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { getAllergies, upsertAllergy, type ChildAllergyResponse } from "@/lib/api/children";
import { searchIngredients } from "@/lib/api/ingredients";
import type { AllergyStatus, IngredientSummaryResponse } from "@/lib/api/types";

const STATUS_LABEL: Record<AllergyStatus, string> = {
  HAS: "있음",
  NONE: "없음",
  UNKNOWN: "알 수 없음",
};

const STATUS_ORDER: AllergyStatus[] = ["HAS", "UNKNOWN", "NONE"];

export default function ChildAllergiesPage() {
  const { childId: childIdParam } = useParams<{ childId: string }>();
  const childId = Number(childIdParam);
  const { token } = useAuth();

  const [allergies, setAllergies] = useState<ChildAllergyResponse[]>([]);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<IngredientSummaryResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadAllergies = () => {
    if (!token || Number.isNaN(childId)) {
      return;
    }
    getAllergies(token, childId).then(setAllergies);
  };

  useEffect(loadAllergies, [token, childId]);

  const handleSearch = async () => {
    if (!token) {
      return;
    }
    setIsSearching(true);
    try {
      setResults(await searchIngredients(token, keyword));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSetStatus = async (ingredientId: number, status: AllergyStatus) => {
    if (!token) {
      return;
    }
    await upsertAllergy(token, childId, ingredientId, status);
    loadAllergies();
  };

  return (
    <main className="flex flex-col gap-6 px-6 py-8">
      <h1 className="text-lg font-semibold">알레르기 관리</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-secondary">등록된 알레르기</h2>
        {allergies.length === 0 ? (
          <p className="text-sm text-text-secondary">등록된 알레르기 정보가 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {allergies.map((allergy) => (
              <li
                key={allergy.ingredientId}
                className="flex items-center justify-between rounded-xl bg-background-element px-4 py-3 text-sm"
              >
                <span>{allergy.ingredientName}</span>
                <span
                  className={
                    allergy.status === "HAS"
                      ? "font-medium text-red-600"
                      : allergy.status === "UNKNOWN"
                        ? "font-medium text-yellow-700"
                        : "text-text-secondary"
                  }
                >
                  {STATUS_LABEL[allergy.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-text-secondary">성분 검색해서 등록</h2>
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSearch()}
            placeholder="예: 우유, 계란, 밀"
            className="flex-1 rounded-xl bg-background-element px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="rounded-xl bg-brand px-4 text-sm font-medium text-white"
          >
            검색
          </button>
        </div>

        <ul className="space-y-2">
          {results.map((ingredient) => (
            <li key={ingredient.id} className="rounded-xl bg-background-element px-4 py-3">
              <p className="text-sm font-medium">{ingredient.name}</p>
              <div className="mt-2 flex gap-2">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleSetStatus(ingredient.id, status)}
                    className="rounded-full bg-background px-3 py-1 text-xs"
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
