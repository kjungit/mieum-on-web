"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { getAllergies, upsertAllergy, type ChildAllergyResponse } from "@/lib/api/children";
import { searchIngredients } from "@/lib/api/ingredients";
import type { AllergyStatus, IngredientSummaryResponse } from "@/lib/api/types";

const STATUS_LABEL: Record<AllergyStatus, string> = {
  HAS: "있음",
  UNKNOWN: "알 수 없음",
  NONE: "없음",
};

const STATUS_ORDER: AllergyStatus[] = ["HAS", "UNKNOWN", "NONE"];

function StatusToggle({
  value,
  onChange,
}: {
  value: AllergyStatus | null;
  onChange: (status: AllergyStatus) => void;
}) {
  return (
    <div className="flex gap-1 rounded-[10px] bg-background-element p-1">
      {STATUS_ORDER.map((status) => {
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className="rounded-lg px-2.5 py-2 text-[11.5px] font-bold"
            style={
              active
                ? { backgroundColor: "var(--background)", color: "var(--foreground)", boxShadow: "0 1px 2px rgba(22,24,26,0.12)" }
                : { color: "var(--text-secondary)" }
            }
          >
            {STATUS_LABEL[status]}
          </button>
        );
      })}
    </div>
  );
}

export default function ChildAllergiesPage() {
  const { childId: childIdParam } = useParams<{ childId: string }>();
  const childId = Number(childIdParam);
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();

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

  const registeredIds = new Set(allergies.map((a) => a.ingredientId));

  return (
    <main className="flex flex-col px-5 py-6 pb-16">
      <p className="mb-1.5 text-xl font-black tracking-tight">
        {selectedChild ? `${selectedChild.name}의 알레르기` : "알레르기 관리"}
      </p>
      <p className="mb-5 text-xs leading-relaxed text-text-secondary">
        체크하지 않은 성분이 &ldquo;없음&rdquo;으로 오인되지 않도록, 있음 · 알 수 없음 · 없음 3단계로 관리해요.{" "}
        <b className="text-[#5B7391]">알 수 없음</b>인 성분이 제품에 있으면 &ldquo;확인 필요&rdquo;로 안내합니다.
      </p>

      {allergies.length > 0 ? (
        <div className="mb-5 flex flex-col gap-2">
          {allergies.map((allergy) => (
            <div
              key={allergy.ingredientId}
              className="flex items-center gap-3 rounded-2xl border border-background-selected bg-background p-3.5"
            >
              <span className="flex-1 text-[13.5px] font-bold">{allergy.ingredientName}</span>
              <StatusToggle
                value={allergy.status}
                onChange={(status) => handleSetStatus(allergy.ingredientId, status)}
              />
            </div>
          ))}
        </div>
      ) : null}

      <section className="flex flex-col gap-2.5">
        <p className="text-[13px] font-bold text-text-secondary">성분 검색해서 등록</p>
        <div className="flex items-center gap-2 rounded-[13px] border border-background-selected bg-background px-4 py-3">
          <Search size={16} className="flex-none text-text-secondary" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSearch()}
            placeholder="예: 우유, 계란, 밀"
            className="flex-1 bg-transparent text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="flex-none text-[12px] font-bold text-brand"
          >
            검색
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {results
            .filter((ingredient) => !registeredIds.has(ingredient.id))
            .map((ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center gap-3 rounded-2xl border border-background-selected bg-background p-3.5"
              >
                <span className="flex-1 text-[13.5px] font-bold">{ingredient.name}</span>
                <StatusToggle value={null} onChange={(status) => handleSetStatus(ingredient.id, status)} />
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}
