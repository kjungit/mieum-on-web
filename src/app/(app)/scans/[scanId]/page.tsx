"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { getScan, type RawIngredientScanResponse } from "@/lib/api/ocr";
import { ScanResultList } from "@/components/scan-result";
import { ScanAnalysis } from "@/components/scan-analysis";
import { BackButton } from "@/components/back-button";
import { LoadError } from "@/components/load-error";
import { errorMessage } from "@/lib/api";

export default function ScanDetailPage() {
  const { scanId: scanIdParam } = useParams<{ scanId: string }>();
  const scanId = Number(scanIdParam);
  const { token } = useAuth();
  const [scan, setScan] = useState<RawIngredientScanResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token || Number.isNaN(scanId)) {
      return;
    }
    Promise.resolve().then(() => setLoadError(null));
    getScan(token, scanId)
      .then(setScan)
      .catch((error) => setLoadError(errorMessage(error, "촬영 결과를 불러오지 못했어요.")));
  }, [token, scanId, attempt]);

  if (!scan) {
    return (
      <main className="px-5 py-4">
        <BackButton fallbackHref="/scans" />
        {loadError ? (
          <LoadError className="mt-4" message={loadError} onRetry={() => setAttempt((n) => n + 1)} />
        ) : (
          <p className="mt-4 text-sm text-text-secondary">불러오는 중…</p>
        )}
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-5 py-4 pb-16">
      <div>
        <BackButton fallbackHref="/scans" />
      </div>
      <div>
        <h1 className="text-lg font-bold">촬영 결과</h1>
        <p className="mt-1 text-xs text-text-secondary">{new Date(scan.createdAt).toLocaleString("ko-KR")}</p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold">분석 결과</h2>
        <ScanAnalysis scanId={scan.id} />
      </section>

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
