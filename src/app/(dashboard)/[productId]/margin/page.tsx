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
        <h1 className="text-lg font-semibold text-sf-text">Margin per Feature</h1>
        <p className="text-xs text-sf-text-secondary">AI cost attribution vs. revenue per feature</p>
      </div>

      {/* Negative margin alert */}
      {negativeMargin.length > 0 && (
        <div className="rounded-lg border border-sf-red/20 bg-sf-red/5 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-sf-red" />
            <span className="text-xs font-medium text-sf-red">
              {negativeMargin.length} feature{negativeMargin.length > 1 ? "s" : ""} with negative margin
            </span>
          </div>
          {negativeMargin.map((feature: MarginFeature) => (
            <div key={feature.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-sf-text-secondary">{feature.feature}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sf-red">{formatMoney(feature.margin)}/mo</span>
                <span className="rounded bg-sf-input px-1.5 py-0.5 font-mono text-[9px] text-sf-text-muted">
                  Switch to {feature.model.includes("GPT-4o") ? "Claude Haiku" : "GPT-4o-mini"}?
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feature list */}
      <div className="rounded-lg border border-sf-border bg-sf-sidebar overflow-hidden">
        <div className="border-b border-sf-border px-4 py-2.5">
          <h2 className="text-[11px] font-medium uppercase tracking-wide text-sf-text-muted">Feature Breakdown</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-sf-border">
              {["Feature", "Model", "Tokens/mo", "LLM Cost", "Attributed Rev.", "Margin"].map((h: string) => (
                <th key={h} className="px-4 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-wide text-sf-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMarginFeatures.map((feature: MarginFeature) => (
              <tr key={feature.id} className="border-b border-sf-border/50 transition-colors hover:bg-sf-input/30">
                <td className="px-4 py-3 font-medium text-sf-text">{feature.feature}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-sf-purple/10 px-1.5 py-0.5 font-mono text-[9px] text-sf-purple">
                    {feature.model}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sf-text-secondary">{formatTokens(feature.tokensPerMonth)}</td>
                <td className="px-4 py-3 font-mono text-sf-teal">{formatMoney(feature.cost)}</td>
                <td className="px-4 py-3 font-mono text-sf-text">{formatMoney(feature.attributedRevenue)}</td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-1 font-mono font-semibold ${feature.margin >= 0 ? "text-sf-green" : "text-sf-red"}`}>
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
            color: "text-sf-teal",
          },
          {
            label: "Total Attributed Rev.",
            value: formatMoney(totalAttributedRevenue),
            color: "text-sf-green",
          },
          {
            label: "Net AI Margin",
            value: formatMoney(totalAiMargin),
            color: totalAiMargin >= 0 ? "text-sf-green" : "text-sf-red",
          },
        ].map((s: any) => (
          <div key={s.label} className="rounded-lg border border-sf-border bg-sf-sidebar p-3.5">
            <div className="font-mono text-[10px] font-medium uppercase tracking-wide text-sf-text-muted">{s.label}</div>
            <div className={`mt-1.5 text-xl font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
