export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-[calc(100vh-74px)] bg-[#f8f7f4] px-5 py-12 text-[#24212d] sm:py-20"><div className="mx-auto max-w-md rounded-3xl border border-[#ebe8e3] bg-white p-7 shadow-sm sm:p-10">{children}</div></main>;
}
