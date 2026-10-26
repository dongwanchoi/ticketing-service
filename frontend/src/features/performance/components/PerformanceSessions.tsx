"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/components/AuthProvider";
import type { PerformanceSession } from "../types";

type SessionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sessions: PerformanceSession[] };

const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
const won = new Intl.NumberFormat("ko-KR");

// The API returns Korean local time without an offset. Do not reinterpret it in the viewer's timezone.
function sessionTime(startsAt: string) {
  const [date, time] = startsAt.split("T");
  return `${date.replaceAll("-", ".")} ${time.slice(0, 5)} (한국 시간)`;
}

function sessionPrice(session: PerformanceSession) {
  if (session.minPrice === null || session.maxPrice === null) return "가격 미등록";
  return session.minPrice === session.maxPrice
    ? `${won.format(session.minPrice)}원`
    : `${won.format(session.minPrice)}원 ~ ${won.format(session.maxPrice)}원`;
}

function isSession(value: unknown): value is PerformanceSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  const price = (amount: unknown) => amount === null || (typeof amount === "number" && Number.isFinite(amount) && amount >= 0);
  return Number.isSafeInteger(session.sessionId) && (session.sessionId as number) > 0
    && typeof session.startsAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(session.startsAt)
    && price(session.minPrice) && price(session.maxPrice)
    && Number.isSafeInteger(session.remainingSeatCount) && (session.remainingSeatCount as number) >= 0;
}

export default function PerformanceSessions({ performanceId }: { performanceId: number }) {
  const { state: auth, busy } = useAuth();
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15_000);
    async function load() {
      try {
        const response = await fetch(`${baseUrl}/api/v1/performances/${performanceId}/sessions`, {
          credentials: "omit", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error(response.status === 404
          ? "공연을 찾을 수 없습니다. 공연 목록에서 다시 확인해 주세요."
          : "관람 회차를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        const sessions: unknown = await response.json();
        if (!Array.isArray(sessions) || !sessions.every(isSession)) throw new Error("회차 정보가 올바르지 않습니다. 다시 시도해 주세요.");
        if (active) setState({ status: "ready", sessions });
      } catch (error) {
        if (active) setState({ status: "error", message: controller.signal.aborted
          ? "회차 조회 시간이 초과되었습니다. 다시 시도해 주세요."
          : error instanceof TypeError ? "서버에 연결할 수 없습니다. 네트워크 상태를 확인하고 다시 시도해 주세요."
          : error instanceof SyntaxError ? "회차 정보가 올바르지 않습니다. 다시 시도해 주세요."
          : error instanceof Error ? error.message : "회차 정보를 확인할 수 없습니다." });
      } finally {
        clearTimeout(timeout);
      }
    }
    void load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [performanceId, attempt]);

  const selected = state.status === "ready" ? state.sessions.find((session) => session.sessionId === selectedId) : undefined;

  function retry() {
    setSelectedId(null);
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  return (
    <aside aria-label="관람 회차 선택과 예매 안내" className="h-fit rounded-[20px] border border-[#e8e2ef] bg-white p-6 shadow-[0_12px_34px_rgba(48,32,80,0.06)] lg:sticky lg:top-8">
      <p className="text-[11px] font-bold tracking-[0.12em] text-[#7355c8]">BOOK YOUR MOMENT</p>
      <h2 className="mt-3 text-xl font-extrabold">관람 회차 선택</h2>
      <p className="mt-3 text-sm leading-6 text-[#78717e]">일정과 가격을 확인하고 원하는 회차를 선택하세요.</p>
      <div className="mt-5" aria-busy={state.status === "loading"}>
        {state.status === "loading" && <p role="status" className="text-sm text-[#756e79]">관람 회차를 불러오고 있습니다.</p>}
        {state.status === "error" && (
          <div>
            <p role="alert" className="text-sm leading-6 text-[#8b4257]">{state.message}</p>
            <button type="button" onClick={retry} className="mt-3 rounded-full border border-[#d8d3df] px-4 py-2 text-sm font-semibold text-[#6042bf]">회차 다시 불러오기</button>
            <Link href="/" className="ml-3 text-sm text-[#6042bf] underline">공연 목록으로</Link>
          </div>
        )}
        {state.status === "ready" && (state.sessions.length === 0 ? (
          <div className="rounded-xl bg-[#f9f8fb] p-4 text-sm leading-6 text-[#756e79]">
            <p role="status">등록된 관람 회차가 없습니다. 일정이 등록되면 이곳에서 확인할 수 있습니다.</p>
            <button type="button" onClick={retry} className="mt-3 rounded-full border border-[#d8d3df] px-4 py-2 font-semibold text-[#6042bf]">회차 다시 불러오기</button>
          </div>
        ) : (
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-semibold text-[#756e79]">관람 회차 선택</legend>
            {state.sessions.map((session) => (
              <label key={session.sessionId} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${selectedId === session.sessionId ? "border-[#7454cf] bg-[#f4f0fc]" : "border-[#ebe8e3]"}`}>
                <input type="radio" name={`performance-${performanceId}-session`} value={session.sessionId} checked={selectedId === session.sessionId} onChange={() => setSelectedId(session.sessionId)} className="mt-1 accent-[#7454cf]" />
                <span className="min-w-0 text-sm leading-6">
                  <time dateTime={session.startsAt} className="block font-semibold">{sessionTime(session.startsAt)}</time>
                  <span className="block text-[#756e79]">{sessionPrice(session)}</span>
                  <span className="block text-[#756e79]">잔여 좌석 {won.format(session.remainingSeatCount)}석</span>
                </span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <section aria-label="선택한 회차" aria-live="polite" className="mt-5 rounded-xl bg-[#f9f8fb] p-4 text-sm leading-6 text-[#756e79]">
        <h3 className="font-semibold">선택한 회차</h3>
        {selected ? <><p>{sessionTime(selected.startsAt)}</p><p>{sessionPrice(selected)}</p><p>잔여 좌석 {won.format(selected.remainingSeatCount)}석</p></> : <p>미선택</p>}
      </section>
      <div className="mt-5 text-sm leading-6 text-[#78717e]">
        {auth.status === "loading" || busy ? <p role="status">로그인 상태를 확인하고 있습니다.</p>
          : auth.status === "error" ? <p role="status">로그인 상태를 확인할 수 없습니다. 상단 메뉴에서 다시 확인해 주세요.</p>
          : auth.status === "anonymous" ? <><p>회차 정보는 로그인 없이 확인할 수 있습니다. 예매 서비스 이용에는 로그인이 필요합니다.</p><Link href="/login" className="mt-3 inline-flex rounded-full border border-[#d8d3df] px-4 py-2 font-semibold text-[#6042bf]">로그인</Link></>
          : <p>로그인되어 있습니다. 좌석 선택과 예약·결제 기능은 준비 중입니다.</p>}
      </div>
      <button disabled type="button" className="mt-5 h-12 w-full cursor-not-allowed rounded-[13px] bg-[#d1cbdc] font-semibold text-white">예매 기능 준비 중</button>
      <p className="mt-3 text-xs leading-5 text-[#9a949f]">잔여 수는 등록된 회차 좌석 기준이며 선점·예약을 반영하지 않습니다. 회차 선택으로 좌석이 확보되지 않으며 로그인 후에도 좌석 선택·예약·결제는 아직 제공되지 않습니다.</p>
    </aside>
  );
}
