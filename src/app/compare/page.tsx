"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { compareProducts, type AnalysisResponse } from "@/lib/api/analysis";
import { SeverityBadge } from "@/components/severity-badge";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();
  const [results, setResults] = useState<AnalysisResponse[]>([]);

  const productIds = (searchParams.get("ids") ?? "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  useEffect(() => {
    if (!token || !selectedChild || productIds.length < 2) {
      return;
    }
    compareProducts(token, selectedChild.id, productIds).then(setResults);
    // productIds는 매 렌더마다 새 배열이라 join한 값으로만 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedChild, productIds.join(",")]);

  if (!selectedChild) {
    return (
      <main className="px-6 py-8">
        <p className="rounded-2xl bg-background-element p-4 text-sm text-text-secondary">
          제품을 비교하려면 아이를 먼저 등록하세요.{" "}
          <Link href="/children/new" className="text-brand underline">
            아이 등록하기
          </Link>
        </p>
      </main>
    );
  }

  const rows: [string, (result: AnalysisResponse) => string][] = [
    ["나트륨", (result) => (result.nutrition?.sodium != null ? `${result.nutrition.sodium}mg` : "-")],
    ["당류", (result) => (result.nutrition?.sugar != null ? `${result.nutrition.sugar}g` : "-")],
    ["단백질", (result) => (result.nutrition?.protein != null ? `${result.nutrition.protein}g` : "-")],
    [
      "알레르기",
      (result) =>
        result.allergyWarnings.length > 0
          ? result.allergyWarnings.map((finding) => finding.ingredientName).join(", ")
          : "없음",
    ],
  ];

  return (
    <main className="flex flex-col gap-4 px-6 py-8">
      <h1 className="text-lg font-semibold">제품 비교</h1>

      {results.length === 0 ? (
        <p className="text-sm text-text-secondary">비교 결과를 불러오는 중…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr>
                <th className="text-left text-text-secondary">항목</th>
                {results.map((result, index) => (
                  <th key={index} className="px-3 text-left font-medium">
                    {result.productName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-text-secondary">종합</td>
                {results.map((result, index) => (
                  <td key={index} className="px-3">
                    <SeverityBadge severity={result.overallGrade} />
                  </td>
                ))}
              </tr>
              {rows.map(([label, getValue]) => (
                <tr key={label}>
                  <td className="text-text-secondary">{label}</td>
                  {results.map((result, index) => (
                    <td key={index} className="rounded-xl bg-background-element px-3 py-2">
                      {getValue(result)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
