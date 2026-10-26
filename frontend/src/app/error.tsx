"use client";

import PerformanceState from "@/features/performance/components/PerformanceState";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <PerformanceState title="공연 정보를 불러오지 못했습니다" description="일시적인 연결 문제일 수 있습니다. 잠시 후 다시 시도해 주세요.">
      <button type="button" onClick={retry} className="rounded-full bg-[#6a49c8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6042bf] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7454cf]">다시 시도</button>
    </PerformanceState>
  );
}
