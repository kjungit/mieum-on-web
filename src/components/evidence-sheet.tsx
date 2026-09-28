"use client";

import { BottomSheet } from "@/components/bottom-sheet";
import { GRADE_META, type OverallGrade } from "@/lib/grade";
import type { EvidenceResponse } from "@/lib/api/types";

export function EvidenceSheet({
  open,
  onClose,
  grade,
  title,
  description,
  evidences,
}: {
  open: boolean;
  onClose: () => void;
  grade: OverallGrade;
  title: string;
  description?: string;
  evidences: EvidenceResponse[];
}) {
  const meta = GRADE_META[grade];

  return (
    <BottomSheet open={open} onClose={onClose}>
      <span
        className="inline-block rounded-md px-2.5 py-1 text-[10px] font-bold"
        style={{ backgroundColor: meta.tintVar, color: meta.colorVar }}
      >
        {meta.short}
      </span>
      <p className="mb-1.5 mt-3 text-lg font-black tracking-tight">{title}</p>
      {description ? (
        <p className="mb-4 text-[12.5px] leading-relaxed text-text-secondary">{description}</p>
      ) : null}

      {evidences.length === 0 ? (
        <p className="rounded-2xl bg-background-element p-4 text-sm text-text-secondary">
          아직 등록된 근거 자료가 없어요.
        </p>
      ) : (
        <div className="mb-3 flex flex-col gap-1.5">
          <p className="mb-1 text-xs font-bold text-text-secondary">참고한 기준</p>
          {evidences.map((evidence) => (
            <a
              key={evidence.id}
              href={evidence.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-1 rounded-xl border border-background-selected bg-background p-3.5 text-left"
            >
              <span className="text-[12px] font-bold">{evidence.sourceOrg}</span>
              <span className="text-[11.5px] leading-relaxed text-text-secondary">{evidence.title}</span>
            </a>
          ))}
        </div>
      )}

      <p className="mb-1 text-[10.5px] leading-relaxed text-text-secondary/70">
        기준이 서로 다를 때는 더 보수적인 쪽으로 판정하고, 두 기준을 모두 보여드려요. 포장지 표기와 앱 결과가
        다를 수 있는 이유입니다.
      </p>
    </BottomSheet>
  );
}
