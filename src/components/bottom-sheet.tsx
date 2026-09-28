"use client";

import type { ReactNode } from "react";

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end bg-[rgba(20,23,26,0.42)]"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-background px-5 pb-10 pt-2.5"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-background-selected" />
        {children}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 block w-full rounded-2xl bg-[#16181A] py-4 text-center text-sm font-bold text-white"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
