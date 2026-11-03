"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { deleteChild, getChild, updateChild, type ChildResponse } from "@/lib/api/children";
import type { Gender } from "@/lib/api/types";
import { ApiError } from "@/lib/api";

const GENDER_OPTIONS: { value: Gender | ""; label: string }[] = [
  { value: "FEMALE", label: "여아" },
  { value: "MALE", label: "남아" },
  { value: "", label: "미입력" },
];

export default function EditChildPage() {
  const { childId: childIdParam } = useParams<{ childId: string }>();
  const childId = Number(childIdParam);
  const { token } = useAuth();
  const { refresh } = useSelectedChild();
  const router = useRouter();

  const [child, setChild] = useState<ChildResponse | null>(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || Number.isNaN(childId)) {
      return;
    }
    getChild(token, childId).then((data) => {
      setChild(data);
      setName(data.name);
      setBirthDate(data.birthDate);
      setGender(data.gender ?? "");
    });
  }, [token, childId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await updateChild(token, childId, { name, birthDate, gender: gender || null });
      await refresh();
      router.push("/children");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "수정에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token) {
      return;
    }
    if (!window.confirm(`${child?.name ?? "이 아이"} 정보를 삭제할까요? 이 작업은 되돌릴 수 없어요.`)) {
      return;
    }
    await deleteChild(token, childId);
    await refresh();
    router.push("/children");
  };

  if (!child) {
    return (
      <main className="px-6 py-8">
        <p className="text-sm text-text-secondary">불러오는 중…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col px-5 py-8 pb-16">
      <p className="mb-5 text-xl font-black tracking-tight">아이 정보 수정</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">이름</span>
          <input
            required
            maxLength={20}
            value={name}
            onChange={(event) => setName(event.target.value)}
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
          {isSubmitting ? "저장 중…" : "저장하기"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDelete}
        className="mt-3 rounded-2xl border border-[rgba(214,74,63,0.35)] py-3.5 text-[13px] font-bold text-[#D64A3F]"
      >
        아이 정보 삭제
      </button>
    </main>
  );
}
