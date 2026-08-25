import type { Severity } from "@/lib/api/types";

const SEVERITY_META: Record<Severity, { emoji: string; label: string; className: string }> = {
  GREEN: { emoji: "🟢", label: "괜찮아요", className: "bg-green-100 text-green-800" },
  YELLOW: { emoji: "🟡", label: "주의가 필요해요", className: "bg-yellow-100 text-yellow-800" },
  RED: { emoji: "🔴", label: "피하는 것이 좋아요", className: "bg-red-100 text-red-800" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${meta.className}`}>
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function NeedsReviewBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background-selected px-3 py-1 text-sm font-medium text-text-secondary">
      ⚠️ 확인 필요
    </span>
  );
}
