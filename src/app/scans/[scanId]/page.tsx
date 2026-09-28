"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { getScan, type RawIngredientScanResponse } from "@/lib/api/ocr";
import { ScanResultList } from "@/components/scan-result";

export default function ScanDetailPage() {
  const { scanId: scanIdParam } = useParams<{ scanId: string }>();
  const scanId = Number(scanIdParam);
  const { token } = useAuth();
  const [scan, setScan] = useState<RawIngredientScanResponse | null>(null);

  useEffect(() => {
    if (!token || Number.isNaN(scanId)) {
      return;
    }
    getScan(token, scanId).then(setScan);
  }, [token, scanId]);

  if (!scan) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-text-secondary">불러오는 중…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-5 py-7 pb-16">
      <div>
        <h1 className="text-lg font-bold">촬영 결과</h1>
        <p className="mt-1 text-xs text-text-secondary">{new Date(scan.createdAt).toLocaleString("ko-KR")}</p>
      </div>

      {scan.ocrRawText ? (
        <section>
          <h2 className="mb-2 text-sm font-bold">인식된 원문</h2>
          <p className="rounded-2xl border border-background-selected p-4 text-sm leading-relaxed text-text-secondary">
            {scan.ocrRawText}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-bold">성분별 매칭 결과</h2>
        <ScanResultList items={scan.items} />
      </section>
    </main>
  );
}
