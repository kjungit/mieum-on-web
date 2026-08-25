"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { getMyScans, type RawIngredientScanSummaryResponse } from "@/lib/api/ocr";

export default function ScansPage() {
  const { token } = useAuth();
  const [scans, setScans] = useState<RawIngredientScanSummaryResponse[]>([]);

  useEffect(() => {
    if (!token) {
      return;
    }
    getMyScans(token).then(setScans);
  }, [token]);

  return (
    <main className="flex flex-col gap-4 px-6 py-8">
      <h1 className="text-lg font-semibold">촬영 기록</h1>

      {scans.length === 0 ? (
        <p className="text-sm text-text-secondary">아직 촬영한 기록이 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {scans.map((scan) => (
            <li key={scan.id}>
              <Link
                href={`/scans/${scan.id}`}
                className="flex items-center justify-between rounded-xl bg-background-element px-4 py-3 text-sm"
              >
                <span>{new Date(scan.createdAt).toLocaleString("ko-KR")}</span>
                <span className="text-text-secondary">
                  매칭 {scan.matchedCount} · 확인 필요 {scan.unmatchedCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
