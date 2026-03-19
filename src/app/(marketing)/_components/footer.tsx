export function Footer() {
  return (
    <footer className="bg-co-base border-t border-co-b py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 pb-8 border-b border-co-b">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded border border-co-acc bg-co-acc flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <div className="font-serif text-co-t font-semibold">CrewOS</div>
            </div>
            <p className="text-xs text-co-t4">The operating system for solo founders.</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-co-t uppercase tracking-wider mb-4">Product</div>
            <nav className="flex flex-col gap-2">
              <a href="/" className="text-xs text-co-t3 hover:text-co-t transition-colors">Features</a>
              <a href="/" className="text-xs text-co-t3 hover:text-co-t transition-colors">Demo</a>
              <a href="/" className="text-xs text-co-t3 hover:text-co-t transition-colors">Pricing</a>
            </nav>
          </div>
          <div>
            <div className="text-xs font-semibold text-co-t uppercase tracking-wider mb-4">Company</div>
            <nav className="flex flex-col gap-2">
              <a href="/" className="text-xs text-co-t3 hover:text-co-t transition-colors">About</a>
              <a href="/" className="text-xs text-co-t3 hover:text-co-t transition-colors">Blog</a>
              <a href="/" className="text-xs text-co-t3 hover:text-co-t transition-colors">Contact</a>
            </nav>
          </div>
          <div>
            <div className="text-xs font-semibold text-co-t uppercase tracking-wider mb-4">Legal</div>
            <nav className="flex flex-col gap-2">
              <a href="/" className="text-xs text-co-t3 hover:text-co-t transition-colors">Privacy</a>
              <a href="/" className="text-xs text-co-t3 hover:text-co-t transition-colors">Terms</a>
            </nav>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-co-t4">
          <div>&copy; 2025 CrewOS. All rights reserved.</div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="/" className="hover:text-co-t transition-colors">Twitter</a>
            <a href="/" className="hover:text-co-t transition-colors">GitHub</a>
            <a href="/" className="hover:text-co-t transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  )
}