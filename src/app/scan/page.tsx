"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { onNativeMessage, postToNative } from "@/lib/native-bridge";
import { createScan, type RawIngredientScanResponse } from "@/lib/api/ocr";
import { ApiError } from "@/lib/api";
import { ScanResultList } from "@/components/scan-result";

type Status = "idle" | "waiting-camera" | "uploading" | "done" | "error";

export default function ScanPage() {
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<RawIngredientScanResponse | null>(null);
  const latestRef = useRef({ token, childId: selectedChild?.id ?? null });

  useEffect(() => {
    latestRef.current = { token, childId: selectedChild?.id ?? null };
  }, [token, selectedChild]);

  useEffect(() => {
    return onNativeMessage(async (message) => {
      if (message.type === "IMAGE_CAPTURED") {
        setStatus("uploading");
        setError(null);
        try {
          const blob = await fetch(message.dataUrl).then((res) => res.blob());
          const { token: currentToken, childId } = latestRef.current;
          if (!currentToken) {
            throw new Error("로그인이 필요해요.");
          }
          const result = await createScan(currentToken, blob, childId);
          setScan(result);
          setStatus("done");
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "업로드에 실패했어요.");
          setStatus("error");
        }
      } else if (message.type === "CAMERA_CANCELLED") {
        setStatus("idle");
      } else if (message.type === "CAMERA_ERROR") {
        setError(message.message);
        setStatus("error");
      }
    });
  }, []);

  const handleCapture = () => {
    setStatus("waiting-camera");
    setError(null);
    setScan(null);
    postToNative({ type: "REQUEST_CAMERA" });
  };

  return (
    <main className="flex flex-col gap-6 px-6 py-8">
      <h1 className="text-lg font-semibold">원재료 촬영</h1>
      <p className="text-sm text-text-secondary">
        제품 뒷면의 원재료 표시를 촬영하면 자동으로 분석해드려요.
      </p>

      <button
        type="button"
        onClick={handleCapture}
        disabled={status === "waiting-camera" || status === "uploading"}
        className="rounded-2xl bg-brand py-6 text-base font-medium text-white disabled:opacity-50"
      >
        {status === "waiting-camera"
          ? "카메라 대기 중…"
          : status === "uploading"
            ? "분석 중…"
            : "📷 사진 촬영하기"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {scan ? (
        <section>
          <h2 className="mb-2 text-sm font-medium text-text-secondary">인식된 원재료</h2>
          <ScanResultList items={scan.items} />
        </section>
      ) : null}

      <Link href="/scans" className="text-center text-sm text-brand">
        지난 촬영 기록 보기 →
      </Link>
    </main>
  );
}
