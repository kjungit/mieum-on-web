"use client";

// 데이터를 불러오지 못했을 때 "불러오는 중…"에 멈추지 않고 이유와 다시 시도를 보여준다.
export function LoadError({
  message = "정보를 불러오지 못했어요.",
  onRetry,
  className = "",
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-background-selected px-4 py-1.5 text-[13px] font-medium"
        >
          다시 시도
        </button>
      ) : null}
    </div>
  );
}
