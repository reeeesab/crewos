'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Grid2X2, BarChart3, TrendingUp, LineChart, Target, AlertCircle, ListChecks, Wallet, Heart, Users,
} from 'lucide-react'

const PAGES = ['portfolio', 'revenue', 'analytics', 'forecasting', 'issues', 'changelog', 'costs', 'health', 'team'] as const
type Page = typeof PAGES[number]

const PAGE_LABELS: Record<Page, string> = {
  portfolio: 'Portfolio',
  revenue: 'Revenue',
  analytics: 'Analytics',
  forecasting: 'Forecasting',
  issues: 'Issues',
  changelog: 'Changelog',
  costs: 'Costs',
  health: 'Health Score',
  team: 'Team',
}

// Icons for sidebar
function IconGrid() { return <Grid2X2 className="w-full h-full" /> }
function IconTrend() { return <TrendingUp className="w-full h-full" /> }
function IconBar() { return <BarChart3 className="w-full h-full" /> }
function IconForecast() { return <LineChart className="w-full h-full" /> }
function IconIssue() { return <AlertCircle className="w-full h-full" /> }
function IconList() { return <ListChecks className="w-full h-full" /> }
function IconWallet() { return <Wallet className="w-full h-full" /> }
function IconHeart() { return <Heart className="w-full h-full" /> }
function IconTeam() { return <Users className="w-full h-full" /> }
function IconTarget() { return <Target className="w-full h-full" /> }

const NAV = [
  { section: 'OVERVIEW', items: [
    { id: 'portfolio', label: 'Portfolio', icon: <IconGrid /> },
    { id: 'revenue', label: 'Revenue', icon: <IconTrend /> },
    { id: 'analytics', label: 'Analytics', icon: <IconBar />, badge: 'new', badgeColor: 'teal' },
    { id: 'forecasting', label: 'Forecasting', icon: <IconForecast />, badge: 'new', badgeColor: 'teal' },
  ]},
  { section: 'BUILD', items: [
    { id: 'issues', label: 'Issues', icon: <IconIssue />, badge: '3', badgeColor: 'red' },
    { id: 'changelog', label: 'Changelog', icon: <IconList />, badge: 'AI', badgeColor: 'acc' },
  ]},
  { section: 'FINANCE', items: [
    { id: 'costs', label: 'Cost tracker', icon: <IconWallet /> },
  ]},
  { section: 'INTELLIGENCE', items: [
    { id: 'health', label: 'Health score', icon: <IconHeart /> },
  ]},
  { section: 'TEAM', items: [
    { id: 'team', label: 'Team & Access', icon: <IconTeam /> },
  ]},
]

function Sidebar({ activePage, onNavigate }: { activePage: Page; onNavigate: (page: Page) => void }) {
  return (
    <div className="bg-co-surface border-r border-co-b px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
      {/* Product switcher */}
      <div className="bg-co-card border border-co-b rounded-lg px-2.5 py-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-co-green" />
          <span className="text-[11px] font-medium text-co-t">Jobtrackfy</span>
        </div>
        <div className="text-[9px] font-mono text-co-green mt-0.5">$2,840 MRR · live</div>
      </div>

      {/* Health badge */}
      <div className="flex justify-between items-center bg-co-grnbg border border-co-green/20 rounded px-2 py-1.5 mb-2">
        <span className="text-[9px] text-co-t2">health score</span>
        <span className="text-[12px] font-semibold font-mono text-co-green">82</span>
      </div>

      {/* Nav sections */}
      {NAV.map(section => (
        <div key={section.section}>
          <div className="text-[8px] font-mono text-co-t5 uppercase tracking-[0.7px] px-2 py-1.5">
            {section.section}
          </div>
          {section.items.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Page)}
              className={cn(
                'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] transition-all text-co-t2 hover:text-co-t',
                activePage === item.id && 'bg-co-accbg text-co-acc'
              )}
            >
              <span className="w-3 h-3 flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-left text-xs">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  'text-[8px] font-mono px-1 py-0.5 rounded',
                  item.badgeColor === 'red' && 'bg-co-redbg text-co-red',
                  item.badgeColor === 'acc' && 'bg-co-accbg text-co-acc',
                  item.badgeColor === 'teal' && 'bg-co-tealbg text-co-teal',
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}

      {/* Bottom: user row */}
      <div className="mt-auto border-t border-co-b pt-2 flex items-center gap-2 px-1">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-co-acc to-co-purple flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0">
          RS
        </div>
        <span className="text-[10px] text-co-t2 flex-1 truncate">Rishabh Singh</span>
      </div>
    </div>
  )
}

// ============= PAGE COMPONENTS =============

function PortfolioPage() {
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'TOTAL MRR', value: '$0', sub: 'Connect Stripe →', color: 'text-co-t2' },
          { label: 'TOTAL ARR', value: '$0', sub: 'Connect Stripe →', color: 'text-co-t2' },
          { label: 'ACTIVE USERS', value: '0', sub: 'Connect GA4 →', color: 'text-co-t2' },
          { label: 'AVG HEALTH', value: '80', sub: 'good', color: 'text-co-green' },
        ].map(s => (
          <div key={s.label} className="bg-co-card border border-co-b rounded-lg p-2.5">
            <div className="text-[8px] font-mono text-co-t4 uppercase tracking-[0.4px] mb-1">{s.label}</div>
            <div className={`text-[18px] font-semibold tracking-tight ${s.color}`}>{s.value}</div>
            <div className="text-[8px] font-mono text-co-t4 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-co-card border border-co-b rounded-xl p-3 flex-1">
        <div className="w-full h-0.5 bg-co-card2 rounded-full mb-3">
          <div className="h-full w-4/5 bg-co-green rounded-full" />
        </div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[13px] font-medium text-co-t">Jobtrackfy</div>
            <div className="text-[9px] font-mono text-co-t4 mt-0.5">https://jobtrackfy.com/</div>
          </div>
          <span className="text-[8px] font-mono bg-co-grnbg text-co-green border border-co-green/20 px-1.5 py-0.5 rounded">LIVE</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: 'MRR', v: '$0', c: 'text-co-t2' },
            { l: 'USERS', v: '0', c: 'text-co-t' },
            { l: 'HEALTH', v: '80', c: 'text-co-green' },
            { l: 'BUGS', v: '0', c: 'text-co-green' },
          ].map(s => (
            <div key={s.l}>
              <div className="text-[8px] font-mono text-co-t4 mb-1">{s.l}</div>
              <div className={`text-[14px] font-semibold ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function RevenuePage() {
  return (
    <>
      <div className="text-[10px] font-mono text-co-t3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-co-green animate-pulse" />
        Synced via DodoPayment · Last sync just now
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'MRR', value: '$2,840', color: 'text-co-green', delta: '↑ 12%' },
          { label: 'ARR', value: '$34k', color: 'text-co-t', delta: 'on track' },
          { label: 'NEW MRR', value: '$640', color: 'text-co-acc', delta: 'this month' },
          { label: 'CHURNED', value: '$180', color: 'text-co-red', delta: '3 churns' },
        ].map(s => (
          <div key={s.label} className="bg-co-card border border-co-b rounded-lg p-2.5">
            <div className="text-[8px] font-mono text-co-t4 mb-1">{s.label}</div>
            <div className={`text-[16px] font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-[8px] text-co-t4 mt-0.5">{s.delta}</div>
          </div>
        ))}
      </div>
      <div className="bg-co-card border border-co-b rounded-lg p-2.5 flex-1">
        <div className="text-[8px] font-mono text-co-t3 uppercase tracking-[0.4px] mb-2">RECENT TRANSACTIONS</div>
        <table className="w-full text-[9px]">
          <thead><tr className="border-b border-co-b">
            {['Customer', 'Plan', 'Amount', 'Status'].map(h => <th key={h} className="text-left py-1 px-1 text-co-t4 font-mono text-[8px]">{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              ['Alex Chen', 'Pro', '$49', 'paid', 'bg-co-grnbg text-co-green'],
              ['Priya S.', 'Growth', '$99', 'paid', 'bg-co-grnbg text-co-green'],
              ['Mike T.', 'Starter', '$19', 'pending', 'bg-co-ambbg text-co-amber'],
              ['Fatima Y.', 'Pro', '$49', 'failed', 'bg-co-redbg text-co-red'],
            ].map(([name, plan, amt, status, cls]) => (
              <tr key={name} className="border-b border-co-b/30 hover:bg-co-card2">
                <td className="py-1 px-1 text-co-t font-medium text-[9px]">{name}</td>
                <td className="py-1 px-1 text-co-t3 text-[9px]">{plan}</td>
                <td className="py-1 px-1 font-mono text-co-t2 text-[9px]">{amt}</td>
                <td className="py-1 px-1"><span className={`${cls} text-[8px] font-mono px-1.5 py-0.5 rounded inline-block`}>{status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function AnalyticsPage() {
  return (
    <>
      <div className="flex items-center gap-2 text-[9px] font-mono text-co-acc bg-co-accbg border border-co-b2 rounded px-2.5 py-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-co-acc animate-pulse" />
        0 active users right now · Property 523650786 · Connected
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: 'SESSIONS', v: '1,269', c: 'text-co-t' },
          { l: 'USERS', v: '359', c: 'text-co-t' },
          { l: 'AVG ENGAGEMENT', v: '11m 42s', c: 'text-co-acc' },
        ].map(s => (
          <div key={s.l} className="bg-co-card border border-co-b rounded-lg p-2.5">
            <div className="text-[8px] font-mono text-co-t4 mb-1">{s.l}</div>
            <div className={`text-[15px] font-semibold ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="bg-co-card border border-co-b rounded-lg p-2.5">
          <div className="text-[8px] font-mono text-co-t3 mb-2">TOP TRAFFIC SOURCES</div>
          {[['(direct) / (none)', '518'], ['accounts.google.com', '487'], ['google / organic', '64']].map(([s, n]) => (
            <div key={s} className="flex justify-between py-1 border-b border-co-b/30 text-[9px]">
              <span className="text-co-t2 font-mono truncate max-w-[110px] text-[8px]">{s}</span>
              <span className="text-co-t font-mono text-[8px]">{n}</span>
            </div>
          ))}
        </div>
        <div className="bg-co-card border border-co-b rounded-lg p-2.5">
          <div className="text-[8px] font-mono text-co-t3 mb-2">USERS BY COUNTRY</div>
          {[['🇮🇳', 'India', '41%', 'text-co-acc'], ['🇺🇸', 'United States', '33%', 'text-co-t']].map(([f, c, p, cl]) => (
            <div key={c} className="flex items-center gap-1.5 py-1 border-b border-co-b/30 text-[9px]">
              <span>{f}</span><span className="flex-1 text-co-t2 text-[8px]">{c}</span><span className={`font-mono text-[8px] ${cl}`}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function ForecastingPage() {
  const actual = [22, 28, 34, 32, 42, 46, 52]
  const forecast = [58, 65, 72, 78, 85, 92]
  const all = [...actual.map(v => ({ v, type: 'actual' })), ...forecast.map(v => ({ v, type: 'forecast' }))]
  const max = Math.max(...all.map(d => d.v))

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {[
          { l: 'PROJECTED MRR', v: '$4,200', c: 'text-co-green', s: 'in 3 months' },
          { l: 'GROWTH RATE', v: '12%', c: 'text-co-t', s: 'monthly avg' },
          { l: 'BREAK-EVEN', v: 'Jun 25', c: 'text-co-acc', s: 'estimated' },
          { l: 'RUNWAY', v: '18mo', c: 'text-co-green', s: 'at current burn' },
        ].map(s => (
          <div key={s.l} className="bg-co-card border border-co-b rounded-lg p-2.5">
            <div className="text-[8px] font-mono text-co-t4 mb-1">{s.l}</div>
            <div className={`text-[16px] font-semibold ${s.c}`}>{s.v}</div>
            <div className="text-[8px] text-co-t4 mt-0.5">{s.s}</div>
          </div>
        ))}
      </div>
      <div className="bg-co-card border border-co-b rounded-lg p-3 flex-1">
        <div className="text-[8px] font-mono text-co-t3 mb-3">MRR FORECAST — 12 MONTHS</div>
        <div className="flex items-end gap-1 h-[140px]">
          {all.map((d, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t transition-all',
                d.type === 'actual' ? 'bg-co-acc' : 'bg-co-acc/30 border border-dashed border-co-acc/40'
              )}
              style={{ height: `${(d.v / max) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function IssuesPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-co-t">Issues</div>
          <div className="text-[9px] text-co-t3 font-mono mt-0.5">0 features · 3 bugs open · 2 completed</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1">
        {[
          { col: 'TO DO', count: 0, items: [], accent: 'text-co-t3' },
          { col: 'IN PROGRESS', count: 1, items: [
            { type: 'F', title: 'AI changelog gen', due: 'Mar 28', pri: 'high', priColor: 'text-co-red' }
          ], accent: 'text-co-acc' },
          { col: 'DONE', count: 2, items: [
            { type: 'F', title: 'CSV export', due: 'Mar 14', pri: 'shipped', priColor: 'text-co-green' },
            { type: 'B', title: 'Safari fix', due: 'Mar 10', pri: 'fixed', priColor: 'text-co-green' }
          ], accent: 'text-co-green' },
        ].map(col => (
          <div key={col.col} className="bg-co-card border border-co-b rounded-lg p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-mono font-medium ${col.accent}`}>{col.col}</span>
              <span className="text-[9px] font-mono text-co-t4 bg-co-card2 rounded px-1">{col.count}</span>
            </div>
            {col.items.map((item, i) => (
              <div key={i} className="bg-co-card2 border border-co-b rounded-md p-2">
                <div className="text-[10px] font-medium text-co-t leading-tight">{item.title}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[8px] text-co-t4 font-mono">{item.due}</span>
                  <span className={`text-[8px] font-mono ${item.priColor}`}>{item.pri}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

function ChangelogPage() {
  return (
    <>
      <div className="text-[9px] font-mono text-co-acc bg-co-accbg border border-co-b2 rounded px-2.5 py-1.5">
        3 issues closed · AI has drafted entries below. Review and publish.
      </div>
      {[
        { type: 'SHIPPED', typeColor: 'bg-co-grnbg text-co-green', date: 'Mar 14',
          title: 'CSV export now available',
          body: 'Export your full dataset with custom date ranges.' },
        { type: 'BUGFIX', typeColor: 'bg-co-redbg text-co-red', date: 'Mar 10',
          title: 'Fixed: upgrade email not sending',
          body: 'Users upgrading to Pro now receive confirmation.' },
      ].map((e, i) => (
        <div key={i} className="bg-co-card border border-co-b rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[8px] font-mono font-medium px-1.5 py-0.5 rounded ${e.typeColor}`}>{e.type}</span>
            <span className="text-[8px] font-mono text-co-t4 ml-auto">{e.date}</span>
          </div>
          <div className="text-[11px] font-medium text-co-t mb-1">{e.title}</div>
          <div className="text-[10px] text-co-t2 leading-relaxed">{e.body}</div>
        </div>
      ))}
    </>
  )
}

function CostsPage() {
  const costs = [
    { name: 'OpenAI GPT-4o', pct: 72, color: 'bg-co-acc', val: '$89' },
    { name: 'AWS RDS', pct: 60, color: 'bg-co-amber', val: '$74' },
    { name: 'Vercel Pro', pct: 48, color: 'bg-co-green', val: '$60' },
    { name: 'Stripe fees', pct: 38, color: 'bg-co-purple', val: '$47' },
  ]
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {[
          { l: 'TOTAL/MO', v: '$441', c: 'text-co-red', s: '↑ $38 vs last month' },
          { l: 'LLM COSTS', v: '$118', c: 'text-co-t', s: 'OpenAI + Anthropic' },
          { l: 'CLOUD INFRA', v: '$196', c: 'text-co-t', s: 'Vercel + AWS' },
          { l: 'COST/USER', v: '$0.25', c: 'text-co-green', s: 'healthy range ✓' },
        ].map(s => (
          <div key={s.l} className="bg-co-card border border-co-b rounded-lg p-2.5">
            <div className="text-[8px] font-mono text-co-t4 mb-1">{s.l}</div>
            <div className={`text-[16px] font-semibold ${s.c}`}>{s.v}</div>
            <div className="text-[8px] text-co-t4 mt-0.5">{s.s}</div>
          </div>
        ))}
      </div>
      <div className="bg-co-card border border-co-b rounded-lg p-3 flex-1">
        <div className="text-[8px] font-mono text-co-t3 mb-2.5">JOBTRACKFY · $312/mo</div>
        {costs.map(c => (
          <div key={c.name} className="flex items-center gap-2 py-1">
            <div className="text-[9px] text-co-t2 w-[90px] flex-shrink-0 truncate">{c.name}</div>
            <div className="flex-1 h-[3px] bg-co-card2 rounded-full">
              <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
            </div>
            <div className="text-[9px] font-mono w-8 text-right text-co-t2">{c.val}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function HealthPage() {
  const dims = [
    { l: 'MRR trend', pct: 90, c: 'bg-co-green', vc: 'text-co-green' },
    { l: 'Churn rate', pct: 72, c: 'bg-co-amber', vc: 'text-co-amber' },
    { l: 'Cost margin', pct: 85, c: 'bg-co-green', vc: 'text-co-green' },
    { l: 'Engagement', pct: 78, c: 'bg-co-acc', vc: 'text-co-acc' },
  ]
  const score = 82
  const circumference = 2 * Math.PI * 28
  const offset = circumference - (score / 100) * circumference

  return (
    <>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="bg-co-card border border-co-b rounded-lg p-3 flex flex-col gap-3">
          <div className="text-[8px] font-mono text-co-t3 uppercase">HEALTH BREAKDOWN</div>
          <svg width="70" height="70" viewBox="0 0 70 70" className="flex-shrink-0">
            <circle cx="35" cy="35" r="28" fill="none" stroke="#111d30" strokeWidth="9" />
            <circle cx="35" cy="35" r="28" fill="none" stroke="#3ecf8e" strokeWidth="9"
              strokeDasharray={`${circumference * score / 100} ${circumference * (1 - score / 100)}`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <text x="35" y="31" textAnchor="middle" fill="#f1f5f9" fontSize="14" fontWeight="600">{score}</text>
            <text x="35" y="42" textAnchor="middle" fill="#334155" fontSize="8">/100</text>
          </svg>
          <div className="flex flex-col gap-1.5">
            {dims.map(d => (
              <div key={d.l} className="flex items-center gap-2">
                <span className="text-[8px] text-co-t3 w-[60px] flex-shrink-0 font-mono">{d.l}</span>
                <div className="flex-1 h-[3px] bg-co-card2 rounded-full">
                  <div className={`h-full rounded-full ${d.c}`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function TeamPage() {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="bg-co-card border border-co-b rounded-lg p-3">
          <div className="text-[8px] font-mono text-co-t3 mb-3">MEMBERS</div>
          <div className="flex items-center gap-2 py-1.5 border-b border-co-b/30">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-co-acc to-co-purple flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0">RS</div>
            <div className="flex-1">
              <div className="text-[10px] font-medium text-co-t">Rishabh Singh</div>
              <div className="text-[8px] text-co-t4 font-mono">rishabh@jobtrackfy.com</div>
            </div>
            <span className="text-[8px] font-mono bg-co-accbg text-co-acc px-1.5 py-0.5 rounded">owner</span>
          </div>
          <div className="mt-3 bg-co-card2 border border-co-b rounded px-2.5 py-2 text-[9px] font-mono text-co-t3">
            + Invite a team member
          </div>
        </div>
        <div className="bg-co-card border border-co-b rounded-lg p-3">
          <div className="text-[8px] font-mono text-co-t3 mb-1">MEMBER PERMISSIONS</div>
          <div className="flex flex-wrap gap-1">
            {['Revenue', 'Roadmap', 'Issues', 'Analytics', 'Changelog'].map(p => (
              <div key={p} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono border bg-co-grnbg text-co-green border-co-green/20">
                <div className="w-1.5 h-1.5 rounded-sm bg-co-green" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function MainContent({ activePage }: { activePage: Page }) {
  return (
    <div className="bg-co-base overflow-hidden p-4 flex flex-col gap-2.5 h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-2.5 h-full"
        >
          {activePage === 'portfolio' && <PortfolioPage />}
          {activePage === 'revenue' && <RevenuePage />}
          {activePage === 'analytics' && <AnalyticsPage />}
          {activePage === 'forecasting' && <ForecastingPage />}
          {activePage === 'issues' && <IssuesPage />}
          {activePage === 'changelog' && <ChangelogPage />}
          {activePage === 'costs' && <CostsPage />}
          {activePage === 'health' && <HealthPage />}
          {activePage === 'team' && <TeamPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function AppPreview() {
  const [activePage, setActivePage] = useState<Page>('portfolio')

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePage(prev => {
        const idx = PAGES.indexOf(prev)
        return PAGES[(idx + 1) % PAGES.length]
      })
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-[1040px] mx-auto mt-12 relative">
      <div className="rounded-[13px] overflow-hidden border border-co-b2 shadow-[0_0_0_1px_rgba(14,165,233,0.1),0_28px_70px_rgba(0,0,0,0.75)]">
        {/* Titlebar */}
        <div className="bg-co-card border-b border-co-b px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 max-w-[260px] mx-auto bg-co-surface border border-co-b rounded px-3 py-1 text-[10px] text-co-t4 font-mono text-center">
            app.crewos.app / {PAGE_LABELS[activePage]}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="bg-co-surface border border-co-b rounded px-3 py-1 text-[10px] text-co-t4 font-mono w-28">
              Search... ⌘K
            </div>
            <div className="w-7 h-7 rounded-md bg-co-surface border border-co-b flex items-center justify-center text-co-t3 text-xs">
              🔔
            </div>
          </div>
        </div>

        {/* App layout: sidebar + main */}
        <div className="grid grid-cols-[182px_1fr] h-[490px] bg-co-base">
          <Sidebar activePage={activePage} onNavigate={setActivePage} />
          <MainContent activePage={activePage} />
        </div>
      </div>

      {/* Glow under frame */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-[radial-gradient(ellipse,rgba(14,165,233,0.1),transparent_70%)]" />

      {/* Page indicator pills */}
      <div className="flex gap-2 justify-center mt-8 flex-wrap px-4">
        {PAGES.map(p => (
          <button
            key={p}
            onClick={() => setActivePage(p)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-mono transition-all border',
              activePage === p
                ? 'bg-co-accbg text-co-acc border-co-b2'
                : 'text-co-t4 border-co-b hover:text-co-t3'
            )}
          >
            {PAGE_LABELS[p]}
          </button>
        ))}
      </div>
    </div>
  )
}
