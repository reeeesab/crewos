export default function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0c0d0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b7fff]">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white animate-pulse" fill="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#5b7fff] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-1.5 w-1.5 rounded-full bg-[#5b7fff] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-1.5 w-1.5 rounded-full bg-[#5b7fff] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
