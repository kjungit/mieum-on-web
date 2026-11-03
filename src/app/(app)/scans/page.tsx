"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleCheck, CircleHelp } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { getMyScans, type RawIngredientScanSummaryResponse } from "@/lib/api/ocr";
import { LoadMoreButton } from "@/components/load-more-button";

export default function ScansPage() {
  const { token } = useAuth();
  const [scans, setScans] = useState<RawIngredientScanSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    getMyScans(token).then((slice) => {
      setScans(slice.items);
      setHasNext(slice.hasNext);
      setPage(0);
    });
  }, [token]);

  const loadMore = async () => {
    if (!token) return;
    setLoadingMore(true);
    try {
      const slice = await getMyScans(token, page + 1);
      // 그사이 새로 촬영하면 다음 페이지가 한 칸씩 밀려 이미 받은 기록이 다시 올 수 있다 — 겹치는 건 뺀다.
      setScans((current) => [
        ...current,
        ...slice.items.filter((item) => !current.some((existing) => existing.id === item.id)),
      ]);
      setHasNext(slice.hasNext);
      setPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="flex flex-col gap-4 px-5 py-7 pb-16">
      <h1 className="text-lg font-bold">촬영 기록</h1>

      {scans.length === 0 ? (
        <p className="text-sm text-text-secondary">아직 촬영한 기록이 없어요.</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-background-selected">
          {scans.map((scan, index) => (
            <li key={scan.id} className={index < scans.length - 1 ? "border-b border-background-selected" : ""}>
              <Link href={`/scans/${scan.id}`} className="flex items-center justify-between px-4 py-3.5 text-sm">
                <span className="font-medium">{new Date(scan.createdAt).toLocaleString("ko-KR")}</span>
                <span className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <CircleCheck size={13} style={{ color: "var(--grade-g)" }} />
                    {scan.matchedCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <CircleHelp size={13} style={{ color: "var(--grade-c)" }} />
                    {scan.unmatchedCount}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <LoadMoreButton hasNext={hasNext} loading={loadingMore} onClick={loadMore} />
    </main>
  );
}
