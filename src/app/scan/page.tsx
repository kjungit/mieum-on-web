"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Barcode, Scan as ScanIcon } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { onNativeMessage, postToNative } from "@/lib/native-bridge";
import { createScan, type RawIngredientScanResponse } from "@/lib/api/ocr";
import { searchProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api";
import { ScanResultList } from "@/components/scan-result";

type Status = "idle" | "waiting-camera" | "uploading" | "done" | "error";
type Mode = "ingredient" | "barcode";

export default function ScanPage() {
  const { token } = useAuth();
  const { selectedChild } = useSelectedChild();
  const [mode, setMode] = useState<Mode>("ingredient");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<RawIngredientScanResponse | null>(null);
  const [barcode, setBarcode] = useState("");
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  const router = useRouter();
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

  const handleBarcodeSearch = async () => {
    if (!token || !barcode.trim()) return;
    setBarcodeSearching(true);
    setBarcodeNotFound(false);
    try {
      const products = await searchProducts(token, { barcode: barcode.trim() });
      if (products[0]) {
        router.push(`/products/${products[0].id}`);
      } else {
        setBarcodeNotFound(true);
      }
    } finally {
      setBarcodeSearching(false);
    }
  };

  const isBusy = status === "waiting-camera" || status === "uploading";

  return (
    <main className="flex min-h-screen flex-col bg-[#14171A] px-5 pb-16 pt-14 text-white">
      <p className="mb-1 text-[22px] font-black tracking-tight">
        {mode === "ingredient" ? "원재료 촬영" : "바코드로 찾기"}
      </p>
      <p className="mb-4 text-xs leading-relaxed text-white/55">
        {mode === "ingredient"
          ? "제품 뒷면의 원재료 표시를 촬영하면 자동으로 분석해드려요."
          : "제품 바코드 번호를 입력하면 바로 찾아드려요."}
      </p>

      <div className="mb-5 flex gap-1 rounded-xl bg-white/[0.09] p-1">
        <button
          type="button"
          onClick={() => setMode("ingredient")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold ${
            mode === "ingredient" ? "bg-white text-[#16181A]" : "text-white/70"
          }`}
        >
          <ScanIcon size={14} />
          원재료 촬영
          <span className="text-[9px] font-medium opacity-50">P0</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("barcode")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold ${
            mode === "barcode" ? "bg-white text-[#16181A]" : "text-white/70"
          }`}
        >
          <Barcode size={14} />
          바코드 스캔
          <span className="text-[9px] font-medium opacity-50">P1</span>
        </button>
      </div>

      {mode === "ingredient" ? (
        <>
          <div className="relative mb-5 flex h-[280px] items-center justify-center overflow-hidden rounded-[20px] bg-[repeating-linear-gradient(160deg,#22272B_0_10px,#1B2024_10px_20px)]">
            <ScanIcon size={36} className="text-white/25" />
          </div>

          <button
            type="button"
            onClick={handleCapture}
            disabled={isBusy}
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white disabled:opacity-50"
            aria-label="촬영하기"
          >
            <span className="h-12 w-12 rounded-full border-2 border-[#14171A]" />
          </button>
          <p className="mb-4 text-center text-xs text-white/55">
            {status === "waiting-camera" ? "카메라 대기 중…" : status === "uploading" ? "분석 중…" : "버튼을 눌러 촬영해요"}
          </p>
        </>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          <input
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleBarcodeSearch()}
            inputMode="numeric"
            placeholder="바코드 번호 입력"
            className="rounded-2xl bg-white/[0.09] px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={handleBarcodeSearch}
            disabled={barcodeSearching || !barcode.trim()}
            className="rounded-2xl bg-white py-3.5 text-sm font-bold text-[#16181A] disabled:opacity-50"
          >
            {barcodeSearching ? "찾는 중…" : "바코드로 찾기"}
          </button>
          {barcodeNotFound ? (
            <p className="text-center text-xs text-white/55">등록된 제품을 찾지 못했어요. 원재료 촬영을 이용해보세요.</p>
          ) : null}
        </div>
      )}

      {error ? <p className="mb-3 text-center text-sm text-[#E8695F]">{error}</p> : null}

      {scan ? (
        <section className="rounded-t-[24px] bg-background px-1 pb-1 pt-5 text-[var(--foreground)]">
          <h2 className="mb-2.5 px-4 text-sm font-bold">인식된 원재료</h2>
          <div className="px-4">
            <ScanResultList items={scan.items} />
          </div>
        </section>
      ) : null}

      <Link href="/scans" className="mt-6 text-center text-sm font-medium text-white/70">
        지난 촬영 기록 보기 →
      </Link>
    </main>
  );
}

