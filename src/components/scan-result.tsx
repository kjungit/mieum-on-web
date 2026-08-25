import type { RawIngredientScanItemResponse } from "@/lib/api/ocr";

export function ScanResultList({ items }: { items: RawIngredientScanItemResponse[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">인식된 원재료가 없어요.</p>;
  }

  return (
    <ul className="space-y-2">
      {items
        .slice()
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl bg-background-element px-4 py-3 text-sm"
          >
            <span>{item.ingredientName ?? item.rawText}</span>
            {item.matchStatus === "UNMATCHED" ? (
              <span className="rounded-full bg-background-selected px-2 py-1 text-xs text-text-secondary">
                ⚠️ 확인 필요
              </span>
            ) : null}
          </li>
        ))}
    </ul>
  );
}
