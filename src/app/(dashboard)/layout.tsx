"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFour, TrendUp, ChartBar, ChartLineUp, Compass, ListDashes,
  Briefcase, Pulse, FileText, CaretDown, Lightning, Gear, CircleNotch,
  List, X, MagnifyingGlass, Bell, Kanban, Trophy
} from "@phosphor-icons/react";
import { trpc } from "@/lib/trpc/provider";
import { IndiqoMark, IndiqoWordmark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const navSections = [
  {
    section: "Overview",
    items: [
      { label: "Portfolio", href: "__portfolio__", icon: SquaresFour },
      { label: "Dashboard", href: "", icon: TrendUp },
      { label: "Revenue", href: "/revenue", icon: ChartBar },
      { label: "Analytics", href: "/analytics", icon: Compass, badge: "new", badgeColor: "cyan" },
      { label: "Forecasting", href: "/forecast", icon: ChartLineUp, badge: "new", badgeColor: "cyan" },
    ],
  },
  {
    section: "Build",
    items: [
      { label: "Board", href: "/roadmap", icon: Kanban },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
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
  },
  {
    section: "Team",
    items: [
      { label: "Team & Access", href: "/team", icon: List },
    ],
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: products, isLoading } = trpc.product.list.useQuery();

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
    setShowProductMenu(false);
  }, [pathname]);

  const pathParts = pathname?.split("/") || [];
  const urlProductId = pathParts[1] && pathParts[1] !== "portfolio" ? pathParts[1] : null;
  type ProductSummary = NonNullable<typeof products>[number];
  const allProducts: ProductSummary[] = products ?? [];

  const currentProduct = useMemo(() => {
    if (allProducts.length === 0) return null;
    return allProducts.find((product) => product.id === urlProductId) || allProducts[0];
  }, [allProducts, urlProductId]);

  const productId = currentProduct?.id;
  const notificationsQuery = trpc.notifications.listEvents.useQuery(
    { productId: productId ?? "", limit: 5 },
    { enabled: Boolean(productId) },
  );
  const unreadQuery = trpc.notifications.getUnreadCount.useQuery(
    { productId: productId ?? "" },
    { enabled: Boolean(productId) },
  );
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: async () => {
      if (!productId) return;
      await Promise.all([
        notificationsQuery.refetch(),
        unreadQuery.refetch(),
      ]);
    },
  });

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
        className="hidden lg:flex flex-col h-full border-r border-brand-border bg-brand-bg shrink-0 relative overflow-hidden"
      >
        {/* Logo */}
        <div className="h-[52px] flex items-center px-4 shrink-0 transition-colors hover:bg-brand-surface-2">
          <Link href="/portfolio" className="flex items-center gap-3 w-full outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded">
            {sidebarOpen ? <IndiqoWordmark size="sm" /> : <IndiqoMark size="md" />}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.section}>
              {sidebarOpen && (
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-muted">
                  {section.section}
                </div>
              )}
              {!sidebarOpen && <div className="h-px w-8 mx-auto bg-brand-border mb-2 mt-4 opacity-50" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isPortfolioItem = item.href === "__portfolio__";
                  const isDisabled = !productId && !isPortfolioItem;

                  const href = isPortfolioItem ? "/portfolio"
                    : isDisabled ? "#"
                    : item.href === "" ? `/${productId}`
                    : `/${productId}${item.href}`;                  const isActive = pathname === href ||
                    (item.href !== "" && productId && pathname?.startsWith(`/${productId}${item.href.split("?")[0]}`));

                  return isDisabled ? (
                    <div key={item.label} className="flex items-center h-8 px-2 rounded-md opacity-30 cursor-not-allowed">
                      <div className="flex items-center justify-center w-5 h-5 shrink-0 text-brand-muted">
                        <item.icon weight="regular" size={18} />
                      </div>
                      {sidebarOpen && <span className="ml-2.5 text-[13px] font-medium text-brand-muted whitespace-nowrap">{item.label}</span>}
                    </div>
                  ) : (
                    <Link
                      key={item.label}
                      href={href}
                      className={cn(
                        "group flex items-center h-8 px-2 rounded-md transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                        isActive ? "bg-brand-surface border-l-2 border-brand-accent shadow-sm" : "hover:bg-brand-surface-2/40"
                      )}
                    >
                      <div className={`flex items-center justify-center w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-accent'}`}>
                        <item.icon weight={isActive ? "fill" : "regular"} size={18} />
                      </div>
                      
                      {sidebarOpen && (
                        <span className={`ml-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ${isActive ? 'text-brand-accent' : 'text-brand-muted group-hover:text-white'}`}>
                          {item.label}
                        </span>
                      )}
                      
                      {sidebarOpen && item.badge && (
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor === 'cyan' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-accent-light/10 text-brand-accent-light'}`}>
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
        <div className="p-3 border-t border-brand-border shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex justify-center lg:justify-start items-center h-8 px-2 rounded-md text-brand-muted hover:bg-brand-surface-2 hover:text-white transition-colors">
             <List size={18} />
             {sidebarOpen && <span className="ml-2.5 text-[13px] font-medium">Collapse</span>}
          </button>
          {sidebarOpen && (
            <div className="mt-2 flex items-center gap-2.5 px-2 py-1.5">
              <UserButton appearance={{ elements: { avatarBox: "h-6 w-6 rounded" } }} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[12px] font-medium text-white truncate">{user?.fullName || 'Builder'}</span>
              </div>
              <Link href={productId ? `/${productId}/settings` : '#'} className="text-brand-muted hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded">
                <Gear size={16} />
              </Link>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Drawer (Simplistic implementation matching design) */}
      {mobileMenuOpen && (
         <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
           <div className="w-[240px] h-full bg-brand-bg border-r border-brand-border p-4" onClick={e => e.stopPropagation()}>
             {/* Simple mobile menu closure */}
             <div className="flex justify-between items-center mb-8">
               <IndiqoWordmark size="sm" />
               <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-brand-muted hover:text-white">
                 <X size={20} />
               </button>
             </div>
             <nav className="flex-1 overflow-y-auto p-4 space-y-8">
               {navSections.map((section) => (
                 <div key={section.section}>
                   <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted opacity-60">
                     {section.section}
                   </div>
                   <div className="space-y-1">
                     {section.items.map((item) => {
                       const isPortfolioItem = item.href === "__portfolio__";
                       const isDisabled = !productId && !isPortfolioItem;

                       const href = isPortfolioItem ? "/portfolio"
                         : isDisabled ? "#"
                         : item.href === "" ? `/${productId}`
                         : `/${productId}${item.href}`;

                       const isActive = pathname === href ||
                         (item.href !== "" && productId && pathname?.startsWith(`/${productId}${item.href.split("?")[0]}`));

                       return (
                         <Link
                           key={item.label}
                           href={href}
                           className={cn(
                             "flex items-center grow h-10 px-3 rounded-lg transition-all",
                             isActive ? "bg-brand-surface text-brand-accent border-l-2 border-brand-accent" : "text-brand-muted active:bg-brand-surface-2"
                           )}
                         >
                           <item.icon weight={isActive ? "fill" : "bold"} size={20} />
                           <span className="ml-3 text-[14px] font-semibold">{item.label}</span>
                           {item.badge && (
                             <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-accent-light/10 text-brand-accent-light">
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
           </div>
         </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10 transition-all">
        {/* TOPBAR */}
        <header className="h-[52px] flex items-center justify-between px-4 lg:px-6 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md sticky top-0 z-30">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-brand-surface-2 text-brand-muted">
               <List size={20} />
            </button>
            <div className="flex items-center gap-2">
              {currentProduct ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProductMenu(!showProductMenu)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-[13px] font-bold text-white hover:border-brand-accent transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-primary to-blue-600 font-black text-[10px] text-white">
                      {currentProduct.name[0]}
                    </div>
                    <span>{currentProduct.name}</span>
                    <CaretDown size={14} className={`transition-transform duration-200 ${showProductMenu ? "rotate-180" : ""}`} />
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
            <button
              onClick={() => {
                const next = !showNotifications;
                setShowNotifications(next);
                if (next && productId) {
                  markAllRead.mutate({ productId });
                }
              }}
              className="text-sf-text-secondary hover:text-white transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-sf-accent-cyan rounded p-1"
            >
              <Bell size={18} />
              {(unreadQuery.data?.count ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sf-accent-rose shadow-[0_0_4px_rgba(244,63,94,0.8)]" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-4 top-[48px] lg:right-6 z-50 w-[320px] rounded-xl border border-sf-border-default bg-sf-bg-elevated/95 backdrop-blur-xl p-2 shadow-2xl"
                >
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-sf-text-muted">Notifications</p>
                    {productId && (
                      <Link
                        href={`/${productId}/settings#notifications-settings`}
                        className="text-[11px] text-sf-accent-cyan hover:underline"
                        onClick={() => setShowNotifications(false)}
                      >
                        Manage
                      </Link>
                    )}
                  </div>
                  <div className="max-h-[260px] overflow-y-auto space-y-1">
                    {(notificationsQuery.data || []).map((event) => (
                      <div key={event.id} className="rounded-lg border border-sf-border-subtle bg-sf-bg-glass px-2.5 py-2">
                        <p className="text-xs font-semibold text-white">{event.title}</p>
                        {event.message && <p className="text-[11px] text-sf-text-secondary mt-0.5">{event.message}</p>}
                        <p className="text-[10px] text-sf-text-muted mt-1">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                    {(!notificationsQuery.data || notificationsQuery.data.length === 0) && (
                      <p className="px-2.5 py-3 text-xs text-sf-text-muted">No notifications yet.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
