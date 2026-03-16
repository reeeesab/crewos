// Mock data for development without external services

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  status: "LIVE" | "BETA" | "ARCHIVED";
  type: string;
  mrr: number;
  arr: number;
  activeUsers: number;
  churnRate: number;
  newMrr: number;
  churnedMrr: number;
  openBugs: number;
  openFeatures: number;
  healthScore: number;
  totalCosts: number;
  netMargin: number;
}

export const mockProducts: MockProduct[] = [
  {
    id: "prod_1",
    name: "ShipFast",
    description: "Next.js boilerplate for SaaS",
    status: "LIVE",
    type: "B2B SaaS",
    mrr: 12400,
    arr: 148800,
    activeUsers: 847,
    churnRate: 2.1,
    newMrr: 1800,
    churnedMrr: 420,
    openBugs: 3,
    openFeatures: 12,
    healthScore: 82,
    totalCosts: 3200,
    netMargin: 74.2,
  },
  {
    id: "prod_2",
    name: "FormBot",
    description: "AI-powered form builder",
    status: "LIVE",
    type: "B2C",
    mrr: 6800,
    arr: 81600,
    activeUsers: 423,
    churnRate: 3.8,
    newMrr: 900,
    churnedMrr: 680,
    openBugs: 7,
    openFeatures: 5,
    healthScore: 61,
    totalCosts: 2800,
    netMargin: 58.8,
  },
  {
    id: "prod_3",
    name: "DevMetrics",
    description: "GitHub analytics for teams",
    status: "BETA",
    type: "Dev tools",
    mrr: 2100,
    arr: 25200,
    activeUsers: 156,
    churnRate: 1.2,
    newMrr: 600,
    churnedMrr: 90,
    openBugs: 1,
    openFeatures: 18,
    healthScore: 74,
    totalCosts: 890,
    netMargin: 57.6,
  },
  {
    id: "prod_4",
    name: "MailPilot",
    description: "AI email sequences",
    status: "ARCHIVED",
    type: "B2B SaaS",
    mrr: 340,
    arr: 4080,
    activeUsers: 28,
    churnRate: 8.2,
    newMrr: 0,
    churnedMrr: 180,
    openBugs: 11,
    openFeatures: 0,
    healthScore: 23,
    totalCosts: 420,
    netMargin: -23.5,
  },
];

export const mockSnapshots = [
  { month: "Jun", mrr: 8200, users: 612 },
  { month: "Jul", mrr: 8900, users: 648 },
  { month: "Aug", mrr: 9400, users: 689 },
  { month: "Sep", mrr: 9800, users: 710 },
  { month: "Oct", mrr: 10200, users: 735 },
  { month: "Nov", mrr: 10800, users: 762 },
  { month: "Dec", mrr: 11100, users: 789 },
  { month: "Jan", mrr: 11500, users: 804 },
  { month: "Feb", mrr: 11900, users: 826 },
  { month: "Mar", mrr: 12400, users: 847 },
];

export const mockIssues = [
  {
    id: "iss_1",
    type: "FEATURE" as const,
    title: "CSV export for dashboard data",
    description: "Allow users to export all dashboard metrics as CSV",
    priority: "P1" as const,
    status: "IN_PROGRESS" as const,
    dueDate: "2025-04-15",
    milestone: "v2.1",
  },
  {
    id: "iss_2",
    type: "FEATURE" as const,
    title: "Multi-currency support",
    description: "Support EUR, GBP, CAD alongside USD",
    priority: "P2" as const,
    status: "OPEN" as const,
    dueDate: "2025-05-01",
    milestone: "v2.2",
  },
  {
    id: "iss_3",
    type: "BUG" as const,
    title: "Auth redirect loop on Safari",
    description: "Users on Safari 17+ get infinite redirect after sign-in",
    priority: "P0" as const,
    status: "IN_PROGRESS" as const,
    dueDate: "2025-03-20",
    milestone: "v2.0.3",
  },
  {
    id: "iss_4",
    type: "FEATURE" as const,
    title: "Team activity timeline",
    description: "Show chronological log of team member actions",
    priority: "MEDIUM" as const,
    status: "OPEN" as const,
    dueDate: "2025-06-01",
    milestone: "v2.3",
  },
  {
    id: "iss_5",
    type: "BUG" as const,
    title: "Stripe webhook retry failures",
    description: "Webhooks fail silently after 3rd retry",
    priority: "P1" as const,
    status: "OPEN" as const,
    dueDate: "2025-03-25",
    milestone: "v2.0.3",
  },
  {
    id: "iss_6",
    type: "FEATURE" as const,
    title: "Dark mode toggle",
    description: "Let users switch between dark and light themes",
    priority: "LOW" as const,
    status: "CLOSED" as const,
    dueDate: "2025-03-10",
    milestone: "v2.0",
  },
  {
    id: "iss_7",
    type: "BUG" as const,
    title: "Chart tooltip misalignment",
    description: "MRR chart tooltip shows wrong position on mobile",
    priority: "P2" as const,
    status: "CLOSED" as const,
    dueDate: "2025-03-12",
    milestone: "v2.0.2",
  },
];

export const mockCosts = [
  { id: "cost_1", name: "OpenAI GPT-4o", category: "LLM" as const, amount: 1240, budget: 1500, month: "2025-03" },
  { id: "cost_2", name: "Anthropic Claude", category: "LLM" as const, amount: 680, budget: 800, month: "2025-03" },
  { id: "cost_3", name: "Vercel Pro", category: "CLOUD" as const, amount: 240, budget: 300, month: "2025-03" },
  { id: "cost_4", name: "Supabase Pro", category: "CLOUD" as const, amount: 250, budget: 250, month: "2025-03" },
  { id: "cost_5", name: "Stripe fees", category: "PAYMENTS" as const, amount: 520, budget: 600, month: "2025-03" },
  { id: "cost_6", name: "Resend", category: "EMAIL" as const, amount: 45, budget: 50, month: "2025-03" },
  { id: "cost_7", name: "Linear", category: "TOOLING" as const, amount: 80, budget: 80, month: "2025-03" },
  { id: "cost_8", name: "Figma", category: "TOOLING" as const, amount: 45, budget: 45, month: "2025-03" },
];

export const mockChangelogs = [
  {
    id: "cl_1",
    title: "Dark mode is here",
    body: "Switch between light and dark themes directly from your settings. The new dark mode uses carefully balanced contrast ratios to keep everything readable while being easy on the eyes during those late-night ship sessions.",
    type: "SHIPPED" as const,
    status: "PUBLISHED" as const,
    createdAt: "2025-03-10",
    publishedAt: "2025-03-10",
  },
  {
    id: "cl_2",
    title: "Chart tooltips now pixel-perfect",
    body: "Fixed a rendering issue where mobile chart tooltips would misalign on smaller viewports. Hover and touch interactions now snap to the correct data point across all screen sizes.",
    type: "BUGFIX" as const,
    status: "PUBLISHED" as const,
    createdAt: "2025-03-12",
    publishedAt: "2025-03-12",
  },
  {
    id: "cl_3",
    title: "Faster CSV exports for dashboards",
    body: "Export your dashboard metrics as CSV files with one click. Includes all revenue, user, and cost data for the selected time period. Available on Team and Agency plans.",
    type: "IMPROVEMENT" as const,
    status: "DRAFT" as const,
    createdAt: "2025-03-14",
    publishedAt: null,
  },
];

export const mockSocialAccounts = [
  { id: "sa_1", platform: "twitter", handle: "@shipfast_dev", followers: 12400, engagement: 4.2, impressions: 89000, weekChange: 3.1 },
  { id: "sa_2", platform: "linkedin", handle: "ShipFast", followers: 3200, engagement: 6.8, impressions: 24000, weekChange: 1.8 },
  { id: "sa_3", platform: "tiktok", handle: "@shipfast", followers: 8900, engagement: 8.1, impressions: 156000, weekChange: 12.4 },
];

export const mockTeamMembers = [
  {
    id: "tm_1",
    name: "Alex Chen",
    email: "alex@shipfast.dev",
    role: "OWNER" as const,
    initials: "AC",
    gradientFrom: "#5b7fff",
    gradientTo: "#9f7aea",
    permissions: {
      revenue: true, roadmap: true, issues: true, costs: true, analytics: true,
      social: true, team: true, changelog: true, billing: true,
      buildInPublic: true, healthScore: true, marginData: true,
    },
  },
  {
    id: "tm_2",
    name: "Sarah Kim",
    email: "sarah@shipfast.dev",
    role: "EDITOR" as const,
    initials: "SK",
    gradientFrom: "#3ecf8e",
    gradientTo: "#38c9b6",
    permissions: {
      revenue: true, roadmap: true, issues: true, costs: false, analytics: true,
      social: true, team: false, changelog: true, billing: false,
      buildInPublic: true, healthScore: true, marginData: false,
    },
  },
  {
    id: "tm_3",
    name: "Jay Patel",
    email: "jay@shipfast.dev",
    role: "VIEWER" as const,
    initials: "JP",
    gradientFrom: "#f5a623",
    gradientTo: "#f16c6c",
    permissions: {
      revenue: true, roadmap: true, issues: true, costs: false, analytics: false,
      social: false, team: false, changelog: false, billing: false,
      buildInPublic: false, healthScore: true, marginData: false,
    },
  },
];

export const mockBIPPosts = [
  {
    id: "bip_1",
    platform: "twitter",
    draftText: "Just shipped dark mode for ShipFast 🌙 Spent 2 days getting the contrast ratios right because I'm that kind of nerd. What feature are you building this weekend?",
    status: "draft",
    sourceType: "feature_shipped",
    sourceLabel: "Dark mode is here",
    createdAt: "2025-03-10",
  },
  {
    id: "bip_2",
    platform: "linkedin",
    draftText: "Small win today: fixed a chart rendering bug that was driving mobile users crazy. Sometimes the most impactful work is the invisible kind — the bugs your users never have to see again.",
    status: "posted",
    sourceType: "bug_closed",
    sourceLabel: "Chart tooltips now pixel-perfect",
    createdAt: "2025-03-12",
    postedAt: "2025-03-12",
  },
  {
    id: "bip_3",
    platform: "tiktok",
    draftText: "POV: you spent 3 months building a feature nobody asked for and it became your #1 conversion driver 😅",
    status: "scheduled",
    sourceType: "feature_shipped",
    sourceLabel: "CSV export for dashboard data",
    createdAt: "2025-03-14",
    scheduledAt: "2025-03-16",
  },
];

export const mockMarginFeatures = [
  { id: "mf_1", feature: "AI Summaries", model: "GPT-4o", tokensPerMonth: 2400000, cost: 840, attributedRevenue: 3200, margin: 2360 },
  { id: "mf_2", feature: "Smart Suggestions", model: "Claude Haiku", tokensPerMonth: 8900000, cost: 220, attributedRevenue: 1800, margin: 1580 },
  { id: "mf_3", feature: "Auto-categorize", model: "GPT-4o-mini", tokensPerMonth: 5200000, cost: 130, attributedRevenue: 900, margin: 770 },
  { id: "mf_4", feature: "Content Generator", model: "Claude Sonnet", tokensPerMonth: 1200000, cost: 960, attributedRevenue: 800, margin: -160 },
];

export const mockTransactions = [
  { id: "tx_1", customer: "Acme Corp", plan: "Team", amount: 5900, date: "2025-03-14", status: "paid" as const },
  { id: "tx_2", customer: "StartupXYZ", plan: "Solo", amount: 2900, date: "2025-03-13", status: "paid" as const },
  { id: "tx_3", customer: "DevStudio", plan: "Agency", amount: 14900, date: "2025-03-12", status: "paid" as const },
  { id: "tx_4", customer: "IndieMaker", plan: "Solo", amount: 2900, date: "2025-03-11", status: "pending" as const },
  { id: "tx_5", customer: "TechBros Inc", plan: "Team", amount: 5900, date: "2025-03-10", status: "failed" as const },
  { id: "tx_6", customer: "BuilderCo", plan: "Solo", amount: 2900, date: "2025-03-09", status: "paid" as const },
];

export const mockRevenueSplit = [
  { plan: "Solo", revenue: 4640, percentage: 37.4, color: "#5b7fff" },
  { plan: "Team", revenue: 4720, percentage: 38.1, color: "#3ecf8e" },
  { plan: "Agency", revenue: 3040, percentage: 24.5, color: "#9f7aea" },
];

export const mockAtRiskCustomers = [
  { id: "ar_1", name: "TechBros Inc", mrr: 5900, risk: "high" as const, reason: "2 failed payments in last 30 days", daysSinceLogin: 18 },
  { id: "ar_2", name: "IndieMaker", mrr: 2900, risk: "at_risk" as const, reason: "Downgraded from Team to Solo", daysSinceLogin: 5 },
  { id: "ar_3", name: "FlexApp", mrr: 2900, risk: "watch" as const, reason: "No login in 12 days", daysSinceLogin: 12 },
  { id: "ar_4", name: "GrowthCo", mrr: 5900, risk: "upsell" as const, reason: "Using 95% of Team plan limits", daysSinceLogin: 1 },
];
