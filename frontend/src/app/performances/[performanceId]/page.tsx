import Link from "next/link";
import { notFound } from "next/navigation";
import type { Performance } from "@/features/performance/types";
import PerformanceSessions from "@/features/performance/components/PerformanceSessions";
import {
  getCategoryLabel,
  getAgeRatingLabel,
  getPosterBackground,
} from "@/features/performance/presentation";

type DetailProps = {
  params: Promise<{ performanceId: string }>;
};

type SaleAvailabilityResponse = {
  performanceId: number;
  onSale: boolean;
};

async function getPerformance(performanceId: number): Promise<Performance | undefined> {
  // 구매자용 공연 단건 API가 아직 없으므로 목록에서 해당 ID를 찾습니다.
  const apiBaseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080";
  const response = await fetch(`${apiBaseUrl}/api/v1/performances`, { cache: "no-store" });
  if (!response.ok) throw new Error(`공연 조회 실패 (${response.status})`);
  const performances = (await response.json()) as Performance[];
  return performances.find((performance) => performance.id === performanceId);
}

async function getSaleAvailability(performanceId: number): Promise<boolean | null> {
  const apiBaseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/performances/${performanceId}/sale-availability`, { cache: "no-store" });
    if (!response.ok) return null;
    const result = (await response.json()) as SaleAvailabilityResponse;
    return result.onSale;
  } catch {
    return null; // 요청 실패는 '판매 불가'와 구분하여 표시합니다.
  }
}

export default async function PerformanceDetailPage({ params }: DetailProps) {
  const { performanceId: rawId } = await params;
  const performanceId = Number(rawId);
  if (!Number.isSafeInteger(performanceId) || performanceId <= 0) notFound();

  const performance = await getPerformance(performanceId);
  if (!performance) notFound();
  const onSale = await getSaleAvailability(performanceId);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#24212d]">

      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
        <nav aria-label="현재 위치" className="mb-7 text-xs text-[#8c8790]">
          <Link href="/" className="hover:underline">공연 탐색</Link> <span className="mx-2">/</span> 공연 상세
        </nav>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div>
            <div className="grid gap-7 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8">
              <div className={`relative flex aspect-[4/5] max-w-[320px] items-center justify-center overflow-hidden rounded-[22px] ${getPosterBackground(performance.category)}`}>
                <div className="absolute -right-16 -top-8 h-52 w-52 rounded-full border border-white/20" />
                <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full border border-white/20" />
                <div className="z-10 flex flex-col items-center gap-3 text-white/75">
                  <span className="font-bold tracking-[0.2em]">MOMENT</span>
                  <span className="h-px w-10 bg-white/40" />
                  <span className="text-xs">공식 포스터 준비 중</span>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <p className="mb-4 text-sm font-bold text-[#7355c8]">{getCategoryLabel(performance.category)}</p>
                <h1 className="break-keep text-3xl font-extrabold leading-snug tracking-tight sm:text-[38px]">{performance.title}</h1>
                <p className="mt-5 text-sm text-[#77727d]">관람등급 · {getAgeRatingLabel(performance.ageRating)}</p>
                <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#6d6672] shadow-sm">
                  <span className={`h-2 w-2 rounded-full ${onSale === true ? "bg-[#36a66d]" : onSale === false ? "bg-[#e4a04c]" : "bg-[#a29aa9]"}`} />
                  {onSale === true ? "판매 정책상 예매 가능" : onSale === false ? "현재 판매 기간이 아닙니다" : "판매 상태를 확인할 수 없습니다"}
                </div>
              </div>
            </div>

            <section className="mt-12 rounded-[20px] border border-[#ebe8e3] bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold">공연 소개</h2>
              <p className="mt-4 whitespace-pre-wrap break-keep text-sm leading-8 text-[#69636f]">
                {performance.description?.trim() || "공연 소개가 아직 등록되지 않았습니다."}
              </p>
            </section>

            <section className="mt-5 rounded-[20px] border border-[#ebe8e3] bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold">관람 일정 안내</h2>
              <p className="mt-3 break-keep text-sm leading-7 text-[#817b85]">관람 회차에서 일정·가격대·잔여 좌석 수를 확인하세요. 일정은 한국 시간 기준입니다. 공연장과 개별 좌석 정보는 아직 제공되지 않습니다.</p>
            </section>
          </div>

          <PerformanceSessions key={performanceId} performanceId={performanceId} />
        </div>
      </div>
    </main>
  );
}
