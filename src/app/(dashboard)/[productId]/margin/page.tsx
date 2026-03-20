"use client";

import { mockMarginFeatures } from "@/lib/mock-data";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

function formatMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

function formatTokens(n: number) {
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export default function MarginPage() {
  type MarginFeature = (typeof mockMarginFeatures)[number];

  const negativeMargin = mockMarginFeatures.filter((feature: MarginFeature) => feature.margin < 0);
  const totalLlmSpend = mockMarginFeatures.reduce((sum: number, feature: MarginFeature) => sum + feature.cost, 0);
  const totalAttributedRevenue = mockMarginFeatures.reduce((sum: number, feature: MarginFeature) => sum + feature.attributedRevenue, 0);
  const totalAiMargin = mockMarginFeatures.reduce((sum: number, feature: MarginFeature) => sum + feature.margin, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Margin per Feature</h1>
        <p className="text-xs text-brand-muted">AI cost attribution vs. revenue per feature</p>
      </div>

      {/* Negative margin alert */}
      {negativeMargin.length > 0 && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span className="text-xs font-medium text-rose-400">
              {negativeMargin.length} feature{negativeMargin.length > 1 ? "s" : ""} with negative margin
            </span>
          </div>
          {negativeMargin.map((feature: MarginFeature) => (
            <div key={feature.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-brand-muted">{feature.feature}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-rose-400">{formatMoney(feature.margin)}/mo</span>
                <span className="rounded bg-brand-bg px-1.5 py-0.5 font-mono text-[9px] text-brand-muted">
                  Switch to {feature.model.includes("GPT-4o") ? "Claude Haiku" : "GPT-4o-mini"}?
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feature list */}
      <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
        <div className="border-b border-brand-border px-4 py-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">Feature Breakdown</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg/50">
              {["Feature", "Model", "Tokens/mo", "LLM Cost", "Attributed Rev.", "Margin"].map((h: string) => (
                <th key={h} className="px-4 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-wide text-brand-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMarginFeatures.map((feature: MarginFeature) => (
              <tr key={feature.id} className="border-b border-brand-border/50 transition-colors hover:bg-brand-bg/30">
                <td className="px-4 py-3 font-medium text-white">{feature.feature}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-purple-500/10 px-1.5 py-0.5 font-mono text-[9px] text-purple-400">
                    {feature.model}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-brand-muted">{formatTokens(feature.tokensPerMonth)}</td>
                <td className="px-4 py-3 font-mono text-cyan-400">{formatMoney(feature.cost)}</td>
                <td className="px-4 py-3 font-mono text-white">{formatMoney(feature.attributedRevenue)}</td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-1 font-mono font-semibold ${feature.margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {feature.margin >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {feature.margin >= 0 ? "+" : ""}{formatMoney(feature.margin)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total LLM Spend",
            value: formatMoney(totalLlmSpend),
            color: "text-cyan-400",
          },
          {
            label: "Total Attributed Rev.",
            value: formatMoney(totalAttributedRevenue),
            color: "text-emerald-400",
          },
          {
            label: "Net AI Margin",
            value: formatMoney(totalAiMargin),
            color: totalAiMargin >= 0 ? "text-emerald-400" : "text-rose-400",
          },
        ].map((s: any) => (
          <div key={s.label} className="rounded-lg border border-brand-border bg-brand-surface p-3.5">
            <div className="font-mono text-[10px] font-medium uppercase tracking-wide text-brand-muted">{s.label}</div>
            <div className={`mt-1.5 text-xl font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
