"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthControls() {
  const { state, busy, notice, refresh, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleLogout() {
    setError(null);
    try { await logout(); }
    catch (error) { setError(error instanceof Error ? error.message : "로그아웃하지 못했습니다."); }
  }

  async function handleRefresh() {
    setChecking(true);
    setError(null);
    try { await refresh(); } catch { /* The provider displays the error. */ }
    finally { setChecking(false); }
  }

  return (
    <div className="flex flex-col items-end gap-1 text-xs sm:text-sm" aria-live="polite">
      {state.status === "loading" ? <span className="text-[#817b85]">로그인 확인 중…</span> :
        state.status === "error" ? (
          <div className="flex items-center gap-2">
            <span className="text-[#9c3434]">로그인 확인 불가</span>
            <button type="button" onClick={handleRefresh} disabled={checking || busy} className="underline disabled:opacity-50">{checking ? "확인 중…" : "다시 확인"}</button>
          </div>
        ) : state.status === "authenticated" ? (
          <div className="flex items-center gap-3">
            <span className="max-w-28 truncate font-semibold" title={state.user.username}>{state.user.username}님</span>
            <button type="button" onClick={handleLogout} disabled={busy} className="rounded-lg border border-[#d9d1e8] px-3 py-2 font-semibold text-[#664ac0] disabled:opacity-50">{busy ? "처리 중…" : "로그아웃"}</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 font-semibold">
            <Link href="/login" className="text-[#664ac0] hover:underline">로그인</Link>
            <Link href="/signup" className="text-[#69636e] hover:underline">회원가입</Link>
          </div>
        )}
      {(error || state.error || notice) && <p role="status" className="max-w-72 text-right text-xs text-[#9c3434]">{error || state.error || notice}</p>}
    </div>
  );
}
