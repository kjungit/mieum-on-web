"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { registerChild } from "@/lib/api/children";
import type { Gender } from "@/lib/api/types";
import { ApiError } from "@/lib/api";

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
      router.push("/children");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "아이 등록에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col gap-6 px-6 py-8">
      <h1 className="text-lg font-semibold">아이 등록</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          이름
          <input
            required
            maxLength={20}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl bg-background-element px-4 py-3"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          생년월일
          <input
            required
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="rounded-xl bg-background-element px-4 py-3"
          />
        </label>

        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1">성별 (선택)</legend>
          <div className="flex gap-4">
            {(["", "MALE", "FEMALE"] as const).map((value) => (
              <label key={value || "unknown"} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === value}
                  onChange={() => setGender(value)}
                />
                {value === "" ? "선택 안 함" : value === "MALE" ? "남아" : "여아"}
              </label>
            ))}
          </div>
        </fieldset>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "등록 중…" : "등록하기"}
        </button>
      </form>
    </main>
  );
}
