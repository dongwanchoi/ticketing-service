import Link from "next/link";
import AuthControls from "@/features/auth/components/AuthControls";

export default function SiteHeader() {
  return (
    <header className="border-b border-[#ebe8e3] bg-white text-[#24212d]">
      <div className="mx-auto flex min-h-[74px] max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-black tracking-[-0.06em] text-[#292232]">
          <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#6a49c8] text-base font-bold tracking-normal text-white">M</span>
          MOMENT
        </Link>
        <nav aria-label="주 메뉴" className="flex items-center gap-5 text-[13px] font-semibold text-[#69636e] sm:gap-8 sm:text-sm">
          <Link href="/" className="text-[#664ac0]">공연 찾기</Link>
          <span title="추후 제공" className="hidden cursor-not-allowed text-[#b3adb8] md:inline">티켓 오픈</span>
          <span title="예매 기능 준비 중" className="hidden cursor-not-allowed text-[#b3adb8] md:inline">내 예매</span>
        </nav>
        <AuthControls />
      </div>
    </header>
  );
}
