"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFour, TrendUp, ChartBar, ChartLineUp, Compass, ListDashes,
  Briefcase, Pulse, FileText, CaretDown, Lightning, Gear, CircleNotch,
  List, X, MagnifyingGlass, Bell, Kanban
} from "@phosphor-icons/react";
import { trpc } from "@/lib/trpc/provider";

const navSections = [
  {
    section: "Overview",
    items: [
      { label: "Portfolio", href: "__portfolio__", icon: SquaresFour },
      { label: "Dashboard", href: "", icon: TrendUp },
      { label: "Revenue", href: "/revenue", icon: ChartBar },
      { label: "Forecasting", href: "/forecast", icon: ChartLineUp, badge: "new", badgeColor: "cyan" },
    ],
  },
  {
    section: "Build",
    items: [
      { label: "Issues", href: "/roadmap", icon: Kanban },
      { label: "Changelog", href: "/changelog", icon: ListDashes, badge: "AI", badgeColor: "violet" },
    ],
  },
  {
    section: "Finance",
    items: [
      { label: "Cost tracker", href: "/costs", icon: Briefcase },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { label: "Health score", href: "/health", icon: Pulse },
      { label: "Acquisition report", href: "/acquisition", icon: FileText, badge: "AI", badgeColor: "violet" },
    ],
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: products, isLoading } = trpc.product.list.useQuery();

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const pathParts = pathname?.split("/") || [];
  const urlProductId = pathParts[1] && pathParts[1] !== "portfolio" ? pathParts[1] : null;
  type ProductSummary = NonNullable<typeof products>[number];
  const allProducts: ProductSummary[] = products ?? [];

  const currentProduct = useMemo(() => {
    if (allProducts.length === 0) return null;
    return allProducts.find((product) => product.id === urlProductId) || allProducts[0];
  }, [allProducts, urlProductId]);

  const productId = currentProduct?.id;

  function getHealthColor(score: number) {
    if (score >= 75) return "bg-sf-accent-emerald";
    if (score >= 50) return "bg-sf-accent-amber";
    return "bg-sf-accent-rose";
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "LIVE": return "bg-sf-accent-emerald/10 text-sf-accent-emerald";
      case "BETA": return "bg-sf-accent-cyan/10 text-sf-accent-cyan";
      case "ARCHIVED": return "bg-sf-text-muted/10 text-sf-text-muted";
      default: return "";
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sf-bg-base">
        <div className="flex flex-col items-center gap-3">
          <CircleNotch weight="bold" className="h-6 w-6 animate-spin text-sf-accent-cyan" />
          <p className="text-xs font-mono text-sf-text-muted">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-sf-bg-base text-sf-text-primary font-sans overflow-hidden">
      
      {/* SIDEBAR (Desktop) */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 64 }}
        className="hidden lg:flex flex-col h-full border-r border-sf-border-subtle bg-sf-bg-base shrink-0 relative overflow-hidden"
      >
        {/* Logo */}
        <div className="h-[52px] flex items-center px-4 shrink-0 transition-colors hover:bg-sf-bg-glass">
          <Link href="/portfolio" className="flex items-center gap-3 w-full outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan rounded">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gradient-to-br from-sf-accent-cyan to-blue-600 shadow-[0_0_12px_rgba(0,212,255,0.3)]">
              <Lightning weight="fill" className="h-4 w-4 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-display text-lg tracking-wide whitespace-nowrap text-white">
                SaaSForge
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.section}>
              {sidebarOpen && (
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-sf-text-muted">
                  {section.section}
                </div>
              )}
              {!sidebarOpen && <div className="h-px w-8 mx-auto bg-sf-border-subtle mb-2 mt-4 opacity-50" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isPortfolioItem = item.href === "__portfolio__";
                  const isDisabled = !productId && !isPortfolioItem;

                  const href = isPortfolioItem ? "/portfolio"
                    : isDisabled ? "#"
                    : item.href === "" ? `/${productId}`
                    : `/${productId}${item.href}`;

                  const isActive = pathname === href ||
                    (item.href !== "" && productId && pathname?.startsWith(`/${productId}${item.href.split("?")[0]}`));

                  return isDisabled ? (
                    <div key={item.label} className="flex items-center h-8 px-2 rounded-md opacity-40 cursor-not-allowed">
                      <div className="flex items-center justify-center w-5 h-5 shrink-0 text-sf-text-muted">
                        <item.icon weight="regular" size={18} />
                      </div>
                      {sidebarOpen && <span className="ml-2.5 text-[13px] font-medium text-sf-text-muted whitespace-nowrap">{item.label}</span>}
                    </div>
                  ) : (
                    <Link
                      key={item.label}
                      href={href}
                      className="group flex items-center h-8 px-2 rounded-md transition-all hover:bg-sf-bg-glass relative outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan"
                    >
                      {isActive && (
                        <motion.div layoutId="activeNav" className="absolute left-0 top-1 bottom-1 w-[2px] bg-sf-accent-cyan rounded-r" />
                      )}
                      
                      <div className={`flex items-center justify-center w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-sf-accent-cyan' : 'text-sf-text-secondary group-hover:text-sf-accent-cyan'}`}>
                        <item.icon weight={isActive ? "fill" : "regular"} size={18} />
                      </div>
                      
                      {sidebarOpen && (
                        <span className={`ml-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ${isActive ? 'text-white' : 'text-sf-text-secondary group-hover:text-white'}`}>
                          {item.label}
                        </span>
                      )}
                      
                      {sidebarOpen && item.badge && (
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor === 'cyan' ? 'bg-sf-accent-cyan/10 text-sf-accent-cyan' : 'bg-sf-accent-violet/10 text-sf-accent-violet'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sf-border-subtle shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex justify-center lg:justify-start items-center h-8 px-2 rounded-md text-sf-text-secondary hover:bg-sf-bg-glass hover:text-white transition-colors">
             <List size={18} />
             {sidebarOpen && <span className="ml-2.5 text-[13px] font-medium">Collapse</span>}
          </button>
          {sidebarOpen && (
            <div className="mt-2 flex items-center gap-2.5 px-2 py-1.5">
              <UserButton appearance={{ elements: { avatarBox: "h-6 w-6 rounded" } }} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[12px] font-medium text-white truncate">{user?.fullName || 'Builder'}</span>
              </div>
              <Link href={productId ? `/${productId}/settings` : '#'} className="text-sf-text-secondary hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan rounded">
                <Gear size={16} />
              </Link>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Drawer (Simplistic implementation matching design) */}
      {mobileMenuOpen && (
         <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
           <div className="w-[240px] h-full bg-sf-bg-base border-r border-sf-border-subtle p-4" onClick={e => e.stopPropagation()}>
             {/* Simple mobile menu closure */}
             <div className="flex justify-between items-center mb-8">
               <span className="font-display text-lg text-white">SaaSForge</span>
               <button onClick={() => setMobileMenuOpen(false)}><X size={24} className="text-sf-text-secondary" /></button>
             </div>
             <nav className="space-y-6">
               {navSections.map(s => (
                 <div key={s.section}>
                   <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-sf-text-muted">{s.section}</div>
                   {s.items.map(i => (
                     <Link key={i.label} href={i.href === "__portfolio__" ? "/portfolio" : (productId ? `/${productId}${i.href}` : "#")} className="flex items-center gap-3 py-2 text-sf-text-secondary">
                        <i.icon size={20} />
                        <span className="text-sm font-medium">{i.label}</span>
                     </Link>
                   ))}
                 </div>
               ))}
             </nav>
           </div>
         </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10 transition-all">
        {/* TOPBAR */}
        <header className="h-[52px] shrink-0 bg-sf-bg-base/80 backdrop-blur-md border-b border-sf-border-subtle flex items-center justify-between px-4 lg:px-6 relative z-30">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-sf-text-secondary hover:text-white">
               <List size={20} />
            </button>
            <div className="flex items-center gap-2 text-[13px] font-medium text-sf-text-secondary">
              <span className="text-sf-text-muted hidden sm:inline">sf</span>
              <span className="text-sf-border-default hidden sm:inline">/</span>
              {currentProduct ? (
                <div className="relative">
                  <button onClick={() => setShowProductMenu(!showProductMenu)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-sf-bg-elevated border border-sf-border-subtle text-white hover:border-sf-border-default transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan">
                    <span className={`w-2 h-2 rounded-full ${getHealthColor(currentProduct.healthScore??0)}`} />
                    {currentProduct.name}
                    <CaretDown size={12} className="text-sf-text-muted ml-0.5" />
                  </button>
                  {/* Dropdown */}
                  <AnimatePresence>
                    {showProductMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1.5 w-[220px] rounded-xl border border-sf-border-default bg-sf-bg-elevated/90 backdrop-blur-xl p-1.5 shadow-2xl z-50 overflow-hidden"
                      >
                        {allProducts.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              router.push(`/${p.id}${pathname.substring(`/${productId}`.length)}`);
                              setShowProductMenu(false);
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                              p.id === productId ? "bg-sf-bg-glass font-semibold text-sf-accent-cyan" : "text-sf-text-secondary hover:bg-sf-bg-glass hover:text-white"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${getHealthColor(p.healthScore ?? 0)}`} />
                            {p.name}
                            <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <span className="text-white bg-sf-bg-elevated px-2.5 py-1.5 rounded-md border border-sf-border-subtle shadow-sm">Portfolio</span>
              )}
            </div>
          </div>

          {/* Right: Search, Notifs */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center justify-between w-[200px] px-3 py-1.5 rounded-md bg-sf-bg-elevated border border-sf-border-subtle text-sf-text-muted text-[13px] hover:text-white hover:border-sf-border-default transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan">
              <div className="flex items-center gap-2">
                <MagnifyingGlass size={14} />
                <span>Search...</span>
              </div>
              <kbd className="font-mono text-[10px] bg-sf-bg-base px-1.5 py-0.5 rounded border border-sf-border-subtle text-sf-text-secondary">⌘K</kbd>
            </button>
            <button className="text-sf-text-secondary hover:text-white transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan rounded p-1">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sf-accent-rose shadow-[0_0_4px_rgba(244,63,94,0.8)]" />
            </button>
            <div className="lg:hidden">
              <UserButton appearance={{ elements: { avatarBox: "h-7 w-7 rounded" } }} />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-sf-bg-surface relative">
          <div className="bg-noise" />
          <div className="bg-grid absolute inset-0 pointer-events-none" />
          <div className="relative z-10 w-full min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-full pt-4 pb-12 px-4 md:px-6 lg:px-8 max-w-[1400px] mx-auto"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
