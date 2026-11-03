"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { registerChild } from "@/lib/api/children";
import type { Gender } from "@/lib/api/types";
import { ApiError } from "@/lib/api";

const GENDER_OPTIONS: { value: Gender | ""; label: string }[] = [
  { value: "FEMALE", label: "여아" },
  { value: "MALE", label: "남아" },
  { value: "", label: "미입력" },
];

export default function NewChildPage() {
  const { token } = useAuth();
  const { refresh, selectChild } = useSelectedChild();
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const child = await registerChild(token, {
        name,
        birthDate,
        gender: gender || null,
      });
      await refresh();
      selectChild(child.id);
      router.push(`/children/${child.id}/allergies`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "아이 등록에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col px-5 py-8 pb-16">
      <p className="mb-1.5 text-xl font-black tracking-tight">아이 등록</p>
      <p className="mb-5 text-xs leading-relaxed text-text-secondary">
        월령은 직접 입력하지 않고 생년월일로 매번 자동 계산해요.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">이름</span>
          <input
            required
            maxLength={20}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="아이 이름"
            className="rounded-[13px] border border-background-selected bg-background px-4 py-3.5 text-sm font-medium"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">생년월일</span>
          <div className="flex items-center justify-between rounded-[13px] border border-background-selected bg-background px-4 py-3.5">
            <input
              required
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="flex-1 bg-transparent text-sm font-medium"
            />
            <span className="flex-none text-[11px] text-brand">월령 자동 계산</span>
          </div>
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-0.5 text-xs font-bold text-text-secondary">
            성별 <span className="font-normal text-text-secondary/70">선택</span>
          </legend>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.value || "unknown"}
                type="button"
                onClick={() => setGender(option.value)}
                className="flex-1 rounded-[13px] border py-3.5 text-[13px] font-medium"
                style={
                  gender === option.value
                    ? { borderColor: "var(--brand)", color: "var(--brand)", backgroundColor: "var(--grade-g-tint)" }
                    : { borderColor: "var(--background-selected)", color: "var(--text-secondary)" }
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="mt-1 text-[11px] leading-relaxed text-text-secondary/70">
          성별은 분석 로직에 사용하지 않고 데이터로만 수집합니다.
        </p>

        {error ? <p className="text-sm text-[#D64A3F]">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-2xl bg-brand py-4 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {isSubmitting ? "등록 중…" : "다음 — 알레르기 등록"}
        </button>
      </form>
    </main>
  );
}
