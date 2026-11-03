"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { BackButton } from "@/components/back-button";
import { LoadError } from "@/components/load-error";
import { errorMessage } from "@/lib/api";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    if (!token || Number.isNaN(childId)) {
      return;
    }
    getCautionIngredients(token, childId)
      .then((list) => {
        setCautionIngredients(list);
        setLoadError(null);
      })
      .catch((error) => setLoadError(errorMessage(error, "지정한 주의 성분을 불러오지 못했어요.")));
  };

  // 추가·삭제·검색이 실패하면 아무 반응 없이 끝나지 않도록 안내한다.
  const run = async (action: () => Promise<void>, fallback: string) => {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(errorMessage(error, fallback));
    }
  };

  useEffect(load, [token, childId]);

  const handleSearch = async () => {
    if (!token) {
      return;
    }
    await run(async () => setResults(await searchIngredients(token, keyword)), "성분을 검색하지 못했어요.");
  };

  const handleAdd = async (ingredientId: number) => {
    if (!token) {
      return;
    }
    await run(async () => {
      await addCautionIngredient(token, childId, ingredientId);
      load();
    }, "추가하지 못했어요. 다시 시도해주세요.");
  };

  const handleRemove = async (ingredientId: number) => {
    if (!token) {
      return;
    }
    await run(async () => {
      await removeCautionIngredient(token, childId, ingredientId);
      load();
    }, "삭제하지 못했어요. 다시 시도해주세요.");
  };

  const isRegistered = (ingredientId: number) =>
    cautionIngredients.some((item) => item.ingredientId === ingredientId);

  return (
    <main className="flex flex-col gap-6 px-5 py-4">
      <BackButton fallbackHref="/children" />
      {loadError ? <LoadError message={loadError} onRetry={load} /> : null}
      {actionError ? <p className="text-sm text-text-secondary">{actionError}</p> : null}
      <div>
        <h1 className="text-[17px] font-black tracking-tight">주의 성분 직접 지정</h1>
        <p className="mt-2 rounded-2xl bg-background-element p-4 text-[11.5px] leading-relaxed text-text-secondary">
          주의 성분은 &ldquo;나쁜 성분&rdquo;이 아니라 아이 기준으로 한 번 더 보는 항목이에요. 각 성분의 근거는
          제품 상세 &gt; 주의 성분 &gt; 근거에서 볼 수 있어요. 이 설정은 알레르기 판정에는 영향을 주지 않아요.
        </p>
      </div>

      <section>
        <h2 className="mb-2.5 text-[13px] font-bold">등록된 주의 성분</h2>
        {cautionIngredients.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-background-selected p-4 text-center text-[12.5px] text-text-secondary">
            등록된 주의 성분이 없어요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {cautionIngredients.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 rounded-[10px] border border-background-selected bg-background px-3 py-2 text-xs font-medium"
              >
                {item.ingredientName}
                <button
                  type="button"
                  onClick={() => handleRemove(item.ingredientId)}
                  className="font-bold text-text-secondary/60"
                  aria-label={`${item.ingredientName} 제거`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-bold">성분 검색해서 등록</h2>
        <div className="flex items-center gap-2 rounded-2xl bg-background-element px-4 py-3">
          <Search size={16} className="flex-none text-text-secondary" strokeWidth={2} />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSearch()}
            placeholder="예: 카페인, 나트륨, 식품첨가물"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-secondary"
          />
          <button type="button" onClick={handleSearch} className="flex-none text-xs font-bold text-brand">
            검색
          </button>
        </div>

        {results.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {results.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex items-center justify-between rounded-2xl border border-background-selected bg-background px-4 py-3 text-sm"
              >
                <span>{ingredient.name}</span>
                <button
                  type="button"
                  disabled={isRegistered(ingredient.id)}
                  onClick={() => handleAdd(ingredient.id)}
                  className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold text-white disabled:bg-background-selected disabled:text-text-secondary"
                >
                  {isRegistered(ingredient.id) ? "등록됨" : "추가"}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
