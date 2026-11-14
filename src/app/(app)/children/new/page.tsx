"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { registerChild } from "@/lib/api/children";
import type { Gender, ProfileRelation } from "@/lib/api/types";
import { RELATION_LABEL, todayLocalIso } from "@/lib/profile";
import { ApiError } from "@/lib/api";
import { BackButton } from "@/components/back-button";

const GENDER_OPTIONS: { value: Gender | ""; label: string }[] = [
  { value: "FEMALE", label: "여" },
  { value: "MALE", label: "남" },
  { value: "", label: "미입력" },
];

const RELATION_OPTIONS: ProfileRelation[] = ["CHILD", "FAMILY", "SELF"];

export default function NewChildPage() {
  const { token } = useAuth();
  const { children: profiles, refresh, selectChild } = useSelectedChild();
  const router = useRouter();

  // 본인 프로필은 가입 때 자동으로 생기므로 보통 이미 있다. 없으면(소셜 로그인 가입) 본인을 기본으로 둔다.
  const hasSelf = profiles.some((profile) => profile.relation === "SELF");
  const [chosenRelation, setRelation] = useState<ProfileRelation>(hasSelf ? "CHILD" : "SELF");
  // 새로고침으로 이 화면에 바로 들어오면 목록이 도착하기 전에 SELF가 기본값으로 잡힌다 — 목록이 와서 본인이 이미 있으면
  // 상태를 고치지 않고 파생값으로 CHILD로 본다(그대로 제출하면 서버가 409를 낸다).
  const relation: ProfileRelation = hasSelf && chosenRelation === "SELF" ? "CHILD" : chosenRelation;
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
        relation,
      });
      await refresh();
      selectChild(child.id);
      router.push(`/children/${child.id}/allergies`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "프로필 등록에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col px-5 py-4 pb-16">
      <div className="mb-2">
        <BackButton />
      </div>
      <p className="mb-1.5 text-xl font-black tracking-tight">프로필 등록</p>
      <p className="mb-5 text-xs leading-relaxed text-text-secondary">
        누구 기준으로 볼지 정해요. 연령은 생년월일로 매번 자동 계산하고, 알레르기는 다음 단계에서 등록해요.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-0.5 text-xs font-bold text-text-secondary">누구인가요?</legend>
          <div className="flex gap-2">
            {RELATION_OPTIONS.map((option) => {
              const disabled = option === "SELF" && hasSelf;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  onClick={() => setRelation(option)}
                  className="flex-1 rounded-[13px] border py-3.5 text-[13px] font-medium disabled:opacity-40"
                  style={
                    relation === option
                      ? { borderColor: "var(--brand)", color: "var(--brand)", backgroundColor: "var(--grade-g-tint)" }
                      : { borderColor: "var(--background-selected)", color: "var(--text-secondary)" }
                  }
                >
                  {RELATION_LABEL[option]}
                </button>
              );
            })}
          </div>
          {hasSelf ? (
            <p className="text-[11px] text-text-secondary/70">본인 프로필은 이미 있어요. 프로필 관리에서 수정할 수 있어요.</p>
          ) : null}
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">이름</span>
          <input
            required
            maxLength={20}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름 또는 별칭"
            className="rounded-[13px] border border-background-selected bg-background px-4 py-3.5 text-sm font-medium"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-text-secondary">생년월일</span>
          <div className="flex items-center justify-between rounded-[13px] border border-background-selected bg-background px-4 py-3.5">
            <input
              required
              type="date"
              max={todayLocalIso()}
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="flex-1 bg-transparent text-sm font-medium"
            />
            <span className="flex-none text-[11px] text-brand">연령 자동 계산</span>
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
