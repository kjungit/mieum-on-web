"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { deleteChild, getChild, updateChild, type ChildResponse } from "@/lib/api/children";
import type { Gender } from "@/lib/api/types";
import { ApiError } from "@/lib/api";

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
    <main className="flex flex-col gap-6 px-6 py-8">
      <h1 className="text-lg font-semibold">아이 정보 수정</h1>

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
          {isSubmitting ? "저장 중…" : "저장하기"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleDelete}
        className="rounded-full border border-red-300 py-3 text-sm font-medium text-red-600"
      >
        아이 정보 삭제
      </button>
    </main>
  );
}
