export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-7 gap-5 bg-co-base/85 backdrop-blur border-b border-co-b">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded border border-co-acc bg-co-acc flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white"></div>
        </div>
        <div className="font-serif text-lg text-co-t tracking-tight">CrewOS</div>
      </div>
      <div className="flex gap-5 ml-5">
        <a href="#features" className="text-xs text-co-t3 hover:text-co-t transition-colors">Features</a>
        <a href="#how-it-works" className="text-xs text-co-t3 hover:text-co-t transition-colors">How it works</a>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <a href="/sign-up" className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-co-b2 text-co-t2 hover:text-co-t hover:border-co-b3 transition-all">
          Sign up
        </a>
        <a href="/sign-in" className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-co-acc hover:bg-co-acc2 transition-all">
          Sign in
        </a>
      </div>
    </nav>
  )
}
