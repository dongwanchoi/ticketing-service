import PerformanceState from "@/features/performance/components/PerformanceState";

export default function Loading() {
  return <PerformanceState loading title="공연 상세 정보를 불러오고 있습니다" description="공연 소개와 판매 상태를 확인하고 있습니다. 잠시만 기다려 주세요." />;
}
