"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const { state, busy, signup, login, refresh } = useAuth();
  const router = useRouter();
  const submitting = useRef(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [checking, setChecking] = useState(false);
  const isSignup = mode === "signup";
  const label = isSignup ? "회원가입" : "로그인";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || busy) return;
    setError(null);
    if (isSignup && password !== confirmation) { setError("비밀번호 확인이 일치하지 않습니다."); return; }
    submitting.current = true;
    try {
      if (isSignup) {
        await signup(username, password);
        setCompleted(true);
      } else {
        await login(username, password);
        router.replace("/");
        router.refresh();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "요청을 처리하지 못했습니다.");
    } finally {
      setPassword("");
      setConfirmation("");
      submitting.current = false;
    }
  }

  if (state.status === "loading") return <p role="status" className="text-center text-[#77727d]">로그인 상태를 확인하고 있습니다…</p>;
  if (state.status === "error") return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-bold">로그인 상태를 확인할 수 없습니다</h1>
      <p role="alert" className="text-sm text-[#9c3434]">{state.error}</p>
      <button type="button" disabled={checking || busy} onClick={async () => {
        setChecking(true);
        try { await refresh(); } catch { /* Displayed from provider state. */ }
        finally { setChecking(false); }
      }} className="rounded-xl bg-[#6a49c8] px-5 py-3 text-white disabled:opacity-50">{checking ? "확인 중…" : "다시 확인"}</button>
    </div>
  );
  if (state.status === "authenticated") return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-bold">이미 로그인되어 있습니다</h1>
      <p className="text-sm text-[#77727d]">{state.user.username}님, 공연을 둘러보세요.</p>
      <Link href="/" className="inline-block rounded-xl bg-[#6a49c8] px-5 py-3 text-white">공연 보러 가기</Link>
    </div>
  );
  if (completed) return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-extrabold">회원가입이 완료되었습니다</h1>
      <p role="status" className="text-sm text-[#77727d]">자동으로 로그인되지 않습니다. 로그인 후 이용해 주세요.</p>
      <Link href="/login" className="inline-block rounded-xl bg-[#6a49c8] px-5 py-3 font-semibold text-white">로그인하러 가기</Link>
    </div>
  );

  const inputClass = "mt-2 h-12 w-full rounded-xl border border-[#dedbe2] bg-[#faf9fb] px-4 outline-none focus:border-[#7454cf] focus:ring-4 focus:ring-[#7454cf]/10 disabled:opacity-60";
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">{label}</h1>
      <p className="mt-3 text-sm leading-6 text-[#77727d]">{isSignup ? "새 계정을 만들고 원하는 공연을 찾아보세요." : "MOMENT에서 나만의 순간을 이어가세요."}</p>
      <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={busy}>
        <div>
          <label htmlFor="username" className="text-sm font-semibold">아이디</label>
          <input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required
            {...(isSignup ? { pattern: "[a-z0-9_]{3,50}", minLength: 3, maxLength: 50 } : {})}
            aria-describedby={isSignup ? "username-help" : undefined}
            value={username} onChange={e => setUsername(e.target.value)} disabled={busy} className={inputClass} />
          {isSignup && <p id="username-help" className="mt-2 text-xs text-[#817b85]">소문자 영문, 숫자, 밑줄(_) 3~50자</p>}
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-semibold">비밀번호</label>
          <input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} required
            {...(isSignup ? { pattern: "[\\x21-\\x7E]{12,72}", minLength: 12, maxLength: 72 } : {})}
            aria-describedby={isSignup ? "password-help" : undefined}
            value={password} onChange={e => setPassword(e.target.value)} disabled={busy} className={inputClass} />
          {isSignup && <p id="password-help" className="mt-2 text-xs leading-5 text-[#817b85]">공백 없는 영문, 숫자, 특수문자(ASCII) 12~72자</p>}
        </div>
        {isSignup && <div>
          <label htmlFor="confirmation" className="text-sm font-semibold">비밀번호 확인</label>
          <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required
            value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} className={inputClass} />
        </div>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm leading-6 text-[#9c3434]">{error}</p>}
        <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[#6a49c8] font-semibold text-white hover:bg-[#5939b7] disabled:cursor-wait disabled:opacity-60">{busy ? "처리 중…" : label}</button>
      </form>
      <p className="mt-6 text-center text-sm text-[#77727d]">{isSignup ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"} <Link href={isSignup ? "/login" : "/signup"} className="ml-2 font-semibold text-[#664ac0] hover:underline">{isSignup ? "로그인" : "회원가입"}</Link></p>
    </>
  );
}
