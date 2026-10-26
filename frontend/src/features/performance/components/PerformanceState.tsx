import Link from "next/link";
import type { ReactNode } from "react";

type PerformanceStateProps = {
  title: string;
  description: string;
  loading?: boolean;
  children?: ReactNode;
};

export default function PerformanceState({ title, description, loading = false, children }: PerformanceStateProps) {
  return (
    <main className="min-h-screen bg-[#f8f7f4] px-5 py-12 text-[#24212d] sm:px-8">
      <section aria-labelledby="performance-state-title" aria-busy={loading} className="mx-auto max-w-[1200px] rounded-[24px] border border-[#eae7e2] bg-white px-5 py-16 text-center shadow-[0_7px_28px_rgba(31,30,45,0.035)] sm:px-9">
        <p className="mb-4 text-[11px] font-bold tracking-[0.18em] text-[#7454cf]">MOMENT</p>
        <div role="status" aria-live="polite">
          <h1 id="performance-state-title" className="break-keep text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-3 break-keep text-sm leading-7 text-[#77737b]">{description}</p>
        </div>
        {loading && <div aria-hidden="true" className="mx-auto mt-7 h-8 w-8 animate-spin rounded-full border-4 border-[#e9e4f5] border-t-[#7454cf] motion-reduce:animate-none" />}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {children}
          <Link href="/" className="rounded-full border border-[#d8d3df] px-5 py-2.5 text-sm font-semibold text-[#6042bf] hover:bg-[#f0ecf9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7454cf]">공연 목록으로</Link>
        </div>
      </section>
    </main>
  );
}
