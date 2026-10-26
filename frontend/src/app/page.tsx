import type { Performance } from "@/features/performance/types";
import PerformanceList from "@/features/performance/components/PerformanceList";

async function getPerformances(): Promise<Performance[]> {
  const apiBaseUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080";
  const response = await fetch(`${apiBaseUrl}/api/v1/performances`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`공연 목록 조회 실패 (${response.status})`);
  }

  return (await response.json()) as Performance[];
}

export default async function Home() {
  const performances = await getPerformances();

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#24212d]">

      <div className="mx-auto max-w-[1200px] px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <PerformanceList performances={performances} />
      </div>

      <footer className="border-t border-[#e9e6e1] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-5 py-8 text-xs text-[#8a8490] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-bold tracking-[0.18em] text-[#615773]">
            MOMENT
          </span>
          <span>공연 정보를 정확히 확인하고, 원하는 순간을 선택하세요.</span>
        </div>
      </footer>
    </main>
  );
}
