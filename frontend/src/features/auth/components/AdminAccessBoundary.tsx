"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function AdminAccessBoundary() {
  const { state } = useAuth();
  // The backend denies all admin routes until provisioning and ownership are implemented.
  // No claimed client role can enable these forms.
  return (
    <main className="mx-auto max-w-xl space-y-4 px-5 py-16 text-[#24212d]">
      <h1 className="text-2xl font-bold">관리자 기능</h1>
      {state.status === "loading" ? <p role="status">로그인 상태를 확인하고 있습니다…</p> :
        state.status === "error" ? <p role="alert">{state.error}</p> :
        state.status === "anonymous" ? <><p>로그인이 필요합니다. 관리자 권한이 없는 계정은 이용할 수 없습니다.</p><Link href="/login" className="font-semibold text-[#664ac0] underline">로그인</Link></> :
        <p role="status">현재 계정으로 이용할 수 없습니다. 관리자 권한 및 소유권 정책이 준비되면 제공됩니다.</p>}
      <Link href="/" className="inline-block text-sm text-[#664ac0] underline">공연 목록으로</Link>
    </main>
  );
}
