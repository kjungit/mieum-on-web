"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleCheck, CircleHelp } from "lucide-react";

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
    </main>
  );
}
