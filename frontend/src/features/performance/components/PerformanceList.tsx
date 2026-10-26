"use client";

import { useState } from "react";
import type { Performance } from "../types";
import { getCategoryLabel } from "../presentation";
import PerformanceCard from "./PerformanceCard";

type PerformanceListProps = {
  performances: Performance[];
};

export default function PerformanceList({ performances }: PerformanceListProps) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("ALL");

  const categories = Array.from(new Set(performances.map((performance) => performance.category)));
  const trimmedKeyword = keyword.trim().toLocaleLowerCase();

  const filteredPerformances = performances.filter((performance) => {
    const matchesKeyword =
      performance.title.toLocaleLowerCase().includes(trimmedKeyword) ||
      (performance.description ?? "").toLocaleLowerCase().includes(trimmedKeyword);
    const matchesCategory = category === "ALL" || performance.category === category;
    return matchesKeyword && matchesCategory;
  });

  const isFiltered = trimmedKeyword.length > 0 || category !== "ALL";
  const firstPerformances = filteredPerformances.slice(0, 3);
  const additionalPerformances = filteredPerformances.slice(3);

  return (
    <>
      <section aria-labelledby="discovery-title" className="rounded-[24px] border border-[#eae7e2] bg-white px-5 py-7 shadow-[0_7px_28px_rgba(31,30,45,0.035)] sm:px-9 sm:py-10">
        <div className="mb-7 flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#7454cf]" />
          <span className="text-[11px] font-bold tracking-[0.18em] text-[#7454cf]">DISCOVER YOUR MOMENT</span>
        </div>
        <h1 id="discovery-title" className="break-keep text-[28px] font-extrabold leading-[1.32] tracking-tight text-[#24212d] sm:text-[38px]">
          어떤 공연을 찾고 계신가요?
        </h1>
        <p className="mt-3 break-keep text-sm leading-6 text-[#77737b] sm:text-[15px]">
          좋아하는 공연을 찾고, 나만의 특별한 순간을 준비하세요.
        </p>

        <div className="relative mt-8">
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#8a8492]">⌕</span>
          <input
            type="search"
            aria-label="공연명 또는 공연 소개 검색"
            placeholder="공연명을 검색해 보세요"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-14 w-full rounded-[14px] border border-[#dedbe2] bg-[#faf9fb] pl-12 pr-4 text-[15px] text-[#24212d] outline-none transition placeholder:text-[#9d98a4] focus:border-[#7454cf] focus:bg-white focus:ring-4 focus:ring-[#7454cf]/10"
          />
        </div>

        <div aria-label="공연 카테고리" className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={category === "ALL"}
            onClick={() => setCategory("ALL")}
            className={`rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${category === "ALL" ? "bg-[#6a49c8] text-white shadow-sm" : "bg-[#f4f2f0] text-[#65606a] hover:bg-[#eae5f6]"}`}
          >
            전체
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${category === item ? "bg-[#6a49c8] text-white shadow-sm" : "bg-[#f4f2f0] text-[#65606a] hover:bg-[#eae5f6]"}`}
            >
              {getCategoryLabel(item)}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs leading-5 text-[#99939d]">
          관람 날짜·지역·가격 필터는 회차 및 가격 API 연동 후 제공됩니다.
        </p>
      </section>

      <section aria-labelledby="performances-title" className="mt-12 sm:mt-16">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
          <div>
            <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-[#7454cf]">EXPLORE</p>
            <h2 id="performances-title" className="text-[23px] font-extrabold tracking-tight text-[#24212d] sm:text-[28px]">공연 둘러보기</h2>
          </div>
          {isFiltered && <p aria-live="polite" className="text-sm text-[#736f79]">검색 결과 <strong className="text-[#6042bf]">{filteredPerformances.length}</strong>개</p>}
        </div>

        {filteredPerformances.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#d8d3df] bg-white px-5 py-16 text-center">
            <p className="text-base font-semibold text-[#312b3b]">일치하는 공연이 없습니다</p>
            <p className="mt-2 text-sm text-[#8a8492]">검색어나 카테고리를 변경해 보세요.</p>
            <button type="button" onClick={() => { setKeyword(""); setCategory("ALL"); }} className="mt-5 rounded-full bg-[#6a49c8] px-5 py-2.5 text-sm font-semibold text-white">전체 공연 보기</button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {firstPerformances.map((performance) => <PerformanceCard key={performance.id} performance={performance} />)}
            </div>

            {!isFiltered && (
              <aside aria-label="공연 탐색 안내" className="mt-7 flex flex-col gap-5 rounded-[20px] border border-[#e9e4f5] bg-[#f0ecf9] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.14em] text-[#7054c1]">DISCOVERY GUIDE</p>
                  <h3 className="mt-2 text-lg font-bold tracking-tight text-[#2d2741]">관람일과 예매 오픈일은 다릅니다</h3>
                  <p className="mt-2 max-w-2xl break-keep text-sm leading-6 text-[#6e6880]">공연 날짜는 관람하는 날, 예매 오픈일은 티켓 구매가 시작되는 날입니다. 일정 정보는 회차 API가 연결되면 공연별로 표시됩니다.</p>
                </div>
                <span className="shrink-0 self-start rounded-full border border-[#c8bae9] px-4 py-2 text-xs font-semibold text-[#644aa5] sm:self-center">예매 가이드</span>
              </aside>
            )}

            {additionalPerformances.length > 0 && (
              <div className="mt-7 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                {additionalPerformances.map((performance) => <PerformanceCard key={performance.id} performance={performance} />)}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
