import Link from "next/link";
import type { Performance } from "../types";
import {
  getAgeRatingLabel,
  getCategoryLabel,
  getPosterBackground,
} from "../presentation";

type PerformanceCardProps = {
  performance: Performance;
};

export default function PerformanceCard({ performance }: PerformanceCardProps) {
  return (
    <Link
      href={`/performances/${performance.id}`}
      aria-label={`${performance.title} 공연 상세 보기`}
      className="group flex min-w-0 overflow-hidden rounded-[18px] border border-[#e9e6e1] bg-white shadow-[0_6px_22px_rgba(31,30,45,0.03)] transition duration-200 hover:-translate-y-1 hover:border-[#c8b9ec] hover:shadow-[0_14px_35px_rgba(31,30,45,0.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b4bd4] sm:flex-col"
    >
      <div
        className={`relative flex h-[148px] w-[112px] shrink-0 items-center justify-center overflow-hidden sm:aspect-[4/5] sm:h-auto sm:w-full ${getPosterBackground(performance.category)}`}
        aria-label="공식 포스터 미등록"
        role="img"
      >
        <div className="pointer-events-none absolute -right-9 -top-12 h-44 w-44 rounded-full border border-white/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full border border-white/20" />
        <div className="pointer-events-none absolute left-4 top-4 h-14 w-14 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex flex-col items-center gap-2 px-2 text-center text-white/80">
          <span className="text-[9px] font-semibold tracking-[0.23em] sm:text-[11px]">MOMENT</span>
          <span className="h-px w-8 bg-white/40" />
          <span className="break-keep text-[10px] leading-4 opacity-80 sm:text-xs">포스터 준비 중</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4 sm:min-h-[180px] sm:px-5 sm:py-5">
        <span className="text-[11px] font-semibold tracking-wide text-[#7154c2]">
          {getCategoryLabel(performance.category)}
        </span>
        <h3 className="mt-2 line-clamp-2 break-keep text-[15px] font-bold leading-6 text-[#22202a] group-hover:text-[#6040c5] sm:text-lg">
          {performance.title}
        </h3>
        <p className="mt-2 line-clamp-2 break-keep text-xs leading-5 text-[#77737b] sm:min-h-10 sm:text-sm">
          {performance.description?.trim() || "공연 상세 소개는 준비 중입니다."}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f0eeeb] pt-3">
          <span className="min-w-0 truncate text-[11px] text-[#8a858e] sm:text-xs">
            {getAgeRatingLabel(performance.ageRating)}
          </span>
          <span aria-hidden="true" className="font-semibold text-[#6650c1] transition group-hover:translate-x-1">
            ↗
          </span>
        </div>
      </div>
    </Link>
  );
}
