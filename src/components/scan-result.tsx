import { CircleCheck, CircleHelp } from "lucide-react";

import type { RawIngredientScanItemResponse } from "@/lib/api/ocr";
import { GRADE_META } from "@/lib/grade";

export function ScanResultList({ items }: { items: RawIngredientScanItemResponse[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">인식된 원재료가 없어요.</p>;
  }

  const unmatchedCount = items.filter((item) => item.matchStatus === "UNMATCHED").length;

  return (
    <div className="flex flex-col gap-3">
      {unmatchedCount > 0 ? (
        <div className="flex items-start gap-2.5 rounded-2xl p-3.5" style={{ backgroundColor: "var(--grade-c-tint)" }}>
          <CircleHelp size={16} style={{ color: "var(--grade-c)" }} className="mt-0.5 flex-none" />
          <p className="text-xs leading-relaxed" style={{ color: "var(--grade-c)" }}>
            원재료 {items.length}개를 읽었고 {items.length - unmatchedCount}개가 성분 DB와 매칭됐어요. 매칭되지
            않은 {unmatchedCount}개는 &ldquo;확인 필요&rdquo;로 표시합니다.
          </p>
        </div>
      ) : null}

      <ul className="overflow-hidden rounded-2xl border border-background-selected">
        {items
          .slice()
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((item, index, all) => (
            <li
              key={item.id}
              className={`flex items-center justify-between px-4 py-3 text-sm ${index < all.length - 1 ? "border-b border-background-selected" : ""}`}
            >
              <span className="font-medium">{item.ingredientName ?? item.rawText}</span>
              {item.matchStatus === "UNMATCHED" ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: GRADE_META.C.tintVar, color: GRADE_META.C.colorVar }}
                >
                  <CircleHelp size={12} />
                  확인 필요
                </span>
              ) : (
                <CircleCheck size={16} style={{ color: "var(--grade-g)" }} />
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
