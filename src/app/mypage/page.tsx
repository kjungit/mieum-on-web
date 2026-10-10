"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Clock, GitCompareArrows, ShieldAlert, UserRound, LogOut, ChevronRight, KeyRound, UserX } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { useSelectedChild } from "@/lib/child-context";
import { ApiError } from "@/lib/api";
import { changePassword, getMe, updateNickname, withdraw, type UserResponse } from "@/lib/api/users";
import { postToNative } from "@/lib/native-bridge";
import { BottomSheet } from "@/components/bottom-sheet";

type Sheet = "nickname" | "password" | "withdraw" | null;

const INPUT_CLASS =
  "w-full rounded-2xl border border-background-selected bg-background px-4 py-3.5 text-sm outline-none focus:border-brand";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.code === "U007") return "현재 비밀번호가 올바르지 않아요.";
    if (error.code === "U008") return "소셜 로그인 계정은 비밀번호가 없어요.";
    return error.message;
  }
  return fallback;
}

const GENDER_LABEL: Record<string, string> = { MALE: "남아", FEMALE: "여아" };

const MENU = [
  { href: "/favorites", label: "즐겨찾기", Icon: Heart },
  { href: "/recent", label: "최근 본 제품", Icon: Clock },
  { href: "/compare", label: "제품 비교함", Icon: GitCompareArrows },
] as const;

export default function MyPage() {
  const { token, logout } = useAuth();
  const { children: childList, selectedChild, selectChild } = useSelectedChild();
  const [me, setMe] = useState<UserResponse | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(setMe)
      .catch(() => setMe(null));
  }, [token]);

  const openSheet = (next: Sheet) => {
    setFormError(null);
    setNotice(null);
    setNickname(me?.nickname ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setSheet(next);
  };

  const submitNickname = async () => {
    const trimmed = nickname.trim();
    if (!token || !trimmed) return;
    if (trimmed.length > 20) {
      setFormError("닉네임은 20자 이하로 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      setMe(await updateNickname(token, trimmed));
      setSheet(null);
    } catch (error) {
      setFormError(errorMessage(error, "닉네임을 바꾸지 못했어요."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitPassword = async () => {
    if (!token || !currentPassword) return;
    if (newPassword.length < 8 || newPassword.length > 64) {
      setFormError("새 비밀번호는 8자 이상 64자 이하로 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const tokens = await changePassword(token, currentPassword, newPassword);
      // 서버가 기존 refresh 토큰을 전부 폐기했다. refresh 토큰은 네이티브만 보관하므로 웹은 저장하지 않고 넘기기만
      // 한다 — 네이티브가 저장한 뒤 TOKEN_REFRESH로 새 access 토큰을 돌려준다.
      postToNative({ type: "SESSION_UPDATED", accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      setSheet(null);
      setNotice("비밀번호를 바꿨어요. 다른 기기에서는 다시 로그인해야 해요.");
    } catch (error) {
      setFormError(errorMessage(error, "비밀번호를 바꾸지 못했어요."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitWithdraw = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await withdraw(token);
      // 서버에서 이미 이 사용자의 refresh 토큰을 모두 폐기했다. 네이티브가 로컬 토큰을 지우고 로그인 화면으로 보낸다.
      logout();
    } catch (error) {
      setFormError(errorMessage(error, "탈퇴하지 못했어요. 잠시 후 다시 시도해주세요."));
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col px-5 py-8 pb-16">
      <p className="mb-5 text-[22px] font-black tracking-tight">마이</p>

      <div className="mb-5 flex items-center gap-3 rounded-[18px] border border-background-selected bg-background p-4">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-background-element">
          <UserRound size={20} className="text-text-secondary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{me ? `${me.nickname}님` : "우리 아이 보호자님"}</p>
          <p className="truncate text-[11px] text-text-secondary">
            {me ? me.email : "미음:ON과 함께 안심 이유식을 준비해요"}
          </p>
        </div>
        {me ? (
          <button type="button" onClick={() => openSheet("nickname")} className="flex-none text-[11px] font-medium text-brand">
            닉네임 변경
          </button>
        ) : null}
      </div>

      {notice ? (
        <p className="mb-4 rounded-2xl bg-background-element p-3.5 text-xs text-text-secondary">{notice}</p>
      ) : null}

      <p className="mb-2.5 text-[13px] font-bold text-text-secondary">아이</p>
      <div className="mb-5 flex flex-col gap-2">
        {childList.length === 0 ? (
          <Link
            href="/children/new"
            className="rounded-2xl border border-dashed border-background-selected p-4 text-center text-sm text-text-secondary"
          >
            아이를 등록하면 아이 맞춤 분석을 받을 수 있어요. 아이 등록하기 →
          </Link>
        ) : (
          // 링크를 선택 버튼 안에 넣으면 <button> 안의 <a>가 되어(잘못된 HTML) 엔진에 따라 이동하지 않는다.
          // 행 전체를 버튼으로 두지 않고, 선택 영역과 알레르기 링크를 나란히 둔다.
          childList.map((child) => (
            <div
              key={child.id}
              className="flex items-center gap-3 rounded-2xl border border-background-selected bg-background p-3.5"
            >
              <button
                type="button"
                onClick={() => selectChild(child.id)}
                aria-pressed={selectedChild?.id === child.id}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-bold"
                  style={{
                    backgroundColor: selectedChild?.id === child.id ? "var(--brand)" : "var(--background-element)",
                    color: selectedChild?.id === child.id ? "#fff" : "var(--foreground)",
                  }}
                >
                  {child.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold">
                    {child.name} · {child.ageMonths}개월
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    {child.gender ? GENDER_LABEL[child.gender] : "성별 미입력"}
                  </p>
                </div>
              </button>
              <Link href={`/children/${child.id}/allergies`} className="flex-none text-[11px] font-medium text-brand">
                알레르기 관리
              </Link>
            </div>
          ))
        )}
        <Link href="/children" className="self-start text-[11px] font-medium text-brand">
          아이 관리 전체보기 ›
        </Link>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-background-selected bg-background">
        {MENU.map(({ href, label, Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 p-4 ${index < MENU.length - 1 ? "border-b border-background-selected" : ""}`}
          >
            <Icon size={16} className="text-text-secondary" />
            <span className="flex-1 text-[13px] font-medium">{label}</span>
            <ChevronRight size={15} className="text-text-secondary/60" />
          </Link>
        ))}
        {selectedChild ? (
          <Link
            href={`/children/${selectedChild.id}/caution-ingredients`}
            className="flex items-center gap-2.5 border-t border-background-selected p-4"
          >
            <ShieldAlert size={16} className="text-text-secondary" />
            <span className="flex-1 text-[13px] font-medium">주의 성분 직접 지정</span>
            <ChevronRight size={15} className="text-text-secondary/60" />
          </Link>
        ) : null}
        {me?.hasPassword ? (
          <button
            type="button"
            onClick={() => openSheet("password")}
            className="flex w-full items-center gap-2.5 border-t border-background-selected p-4 text-left"
          >
            <KeyRound size={16} className="text-text-secondary" />
            <span className="flex-1 text-[13px] font-medium">비밀번호 변경</span>
            <ChevronRight size={15} className="text-text-secondary/60" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 border-t border-background-selected p-4 text-left"
        >
          <LogOut size={16} className="text-text-secondary" />
          <span className="flex-1 text-[13px] font-medium">로그아웃</span>
        </button>
      </div>

      {me ? (
        <button
          type="button"
          onClick={() => openSheet("withdraw")}
          className="mt-4 flex items-center gap-1.5 self-start text-[11px] font-medium text-text-secondary/70"
        >
          <UserX size={13} />
          회원 탈퇴
        </button>
      ) : null}

      <BottomSheet open={sheet === "nickname"} onClose={() => setSheet(null)}>
        <p className="mb-3 text-lg font-black tracking-tight">닉네임 변경</p>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={20}
          placeholder="닉네임 (20자 이하)"
          className={INPUT_CLASS}
        />
        {formError ? <p className="mt-2 text-xs text-[var(--grade-r)]">{formError}</p> : null}
        <button
          type="button"
          onClick={submitNickname}
          disabled={submitting || !nickname.trim()}
          className="mt-4 w-full rounded-2xl bg-brand py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? "저장 중…" : "저장"}
        </button>
      </BottomSheet>

      <BottomSheet open={sheet === "password"} onClose={() => setSheet(null)}>
        <p className="mb-3 text-lg font-black tracking-tight">비밀번호 변경</p>
        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="현재 비밀번호"
            className={INPUT_CLASS}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="새 비밀번호 (8자 이상)"
            className={INPUT_CLASS}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
          비밀번호를 바꾸면 다른 기기에서는 로그아웃돼요.
        </p>
        {formError ? <p className="mt-2 text-xs text-[var(--grade-r)]">{formError}</p> : null}
        <button
          type="button"
          onClick={submitPassword}
          disabled={submitting || !currentPassword || !newPassword}
          className="mt-4 w-full rounded-2xl bg-brand py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? "변경 중…" : "비밀번호 변경"}
        </button>
      </BottomSheet>

      <BottomSheet open={sheet === "withdraw"} onClose={() => setSheet(null)}>
        <p className="mb-2 text-lg font-black tracking-tight">회원 탈퇴</p>
        <p className="text-[12.5px] leading-relaxed text-text-secondary">
          탈퇴하면 바로 로그아웃되고 다시 로그인할 수 없어요. 등록한 아이 정보와 기록은 탈퇴 후 보관 기간이
          지나면 완전히 삭제돼요.
        </p>
        {formError ? <p className="mt-2 text-xs text-[var(--grade-r)]">{formError}</p> : null}
        <button
          type="button"
          onClick={submitWithdraw}
          disabled={submitting}
          className="mt-4 w-full rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--grade-r)" }}
        >
          {submitting ? "처리 중…" : "탈퇴하기"}
        </button>
      </BottomSheet>

      <p className="mt-5 text-[10.5px] leading-relaxed text-text-secondary/70">
        본 서비스의 분석 결과는 공개된 자료와 서비스 내부 기준에 따른 참고 정보이며, 의학적 진단·치료·처방을
        대신하지 않습니다.
      </p>
    </main>
  );
}
