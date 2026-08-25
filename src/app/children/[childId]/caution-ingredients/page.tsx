"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import {
  addCautionIngredient,
  getCautionIngredients,
  removeCautionIngredient,
  type ChildCautionIngredientResponse,
} from "@/lib/api/children";
import { searchIngredients } from "@/lib/api/ingredients";
import type { IngredientSummaryResponse } from "@/lib/api/types";

export default function ChildCautionIngredientsPage() {
  const { childId: childIdParam } = useParams<{ childId: string }>();
  const childId = Number(childIdParam);
  const { token } = useAuth();

  const [cautionIngredients, setCautionIngredients] = useState<ChildCautionIngredientResponse[]>([]);
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<IngredientSummaryResponse[]>([]);

  const load = () => {
    if (!token || Number.isNaN(childId)) {
      return;
    }
    getCautionIngredients(token, childId).then(setCautionIngredients);
  };

  useEffect(load, [token, childId]);

  const handleSearch = async () => {
    if (!token) {
      return;
    }
    setResults(await searchIngredients(token, keyword));
  };

  const handleAdd = async (ingredientId: number) => {
    if (!token) {
      return;
    }
    await addCautionIngredient(token, childId, ingredientId);
    load();
  };

  const handleRemove = async (ingredientId: number) => {
    if (!token) {
      return;
    }
    await removeCautionIngredient(token, childId, ingredientId);
    load();
  };

  const isRegistered = (ingredientId: number) =>
    cautionIngredients.some((item) => item.ingredientId === ingredientId);

  return (
    <main className="flex flex-col gap-6 px-6 py-8">
      <h1 className="text-lg font-semibold">주의 성분 관리</h1>
      <p className="text-sm text-text-secondary">
        카페인, 당류, 나트륨 등 부모님이 직접 신경 쓰고 싶은 성분을 등록해두세요.
      </p>

      <section>
        <h2 className="mb-2 text-sm font-medium text-text-secondary">등록된 주의 성분</h2>
        {cautionIngredients.length === 0 ? (
          <p className="text-sm text-text-secondary">등록된 주의 성분이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {cautionIngredients.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-background-element px-4 py-3 text-sm"
              >
                <span>{item.ingredientName}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.ingredientId)}
                  className="text-xs text-red-600"
                >
                  제거
                </button>
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
            placeholder="예: 카페인, 나트륨"
            className="flex-1 rounded-xl bg-background-element px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-xl bg-brand px-4 text-sm font-medium text-white"
          >
            검색
          </button>
        </div>

        <ul className="space-y-2">
          {results.map((ingredient) => (
            <li
              key={ingredient.id}
              className="flex items-center justify-between rounded-xl bg-background-element px-4 py-3 text-sm"
            >
              <span>{ingredient.name}</span>
              <button
                type="button"
                disabled={isRegistered(ingredient.id)}
                onClick={() => handleAdd(ingredient.id)}
                className="rounded-full bg-background px-3 py-1 text-xs disabled:opacity-40"
              >
                {isRegistered(ingredient.id) ? "등록됨" : "추가"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
