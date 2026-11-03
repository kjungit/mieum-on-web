"use client";

// 페이지로 나뉜 목록(제품 검색·즐겨찾기·촬영 기록) 아래의 "더 보기". 다음 페이지가 없으면 그리지 않는다.
export function LoadMoreButton({
  hasNext,
  loading,
  onClick,
}: {
  hasNext: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  if (!hasNext) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-2xl border border-background-selected py-3 text-sm font-medium text-text-secondary disabled:opacity-50"
    >
      {loading ? "불러오는 중…" : "더 보기"}
    </button>
  );
}
