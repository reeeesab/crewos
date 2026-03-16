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
  const negativeMargin = mockMarginFeatures.filter((f) => f.margin < 0);

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
          {negativeMargin.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-sf-text-secondary">{f.feature}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sf-red">{formatMoney(f.margin)}/mo</span>
                <span className="rounded bg-sf-input px-1.5 py-0.5 font-mono text-[9px] text-sf-text-muted">
                  Switch to {f.model.includes("GPT-4o") ? "Claude Haiku" : "GPT-4o-mini"}?
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
              {["Feature", "Model", "Tokens/mo", "LLM Cost", "Attributed Rev.", "Margin"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-wide text-sf-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMarginFeatures.map((f) => (
              <tr key={f.id} className="border-b border-sf-border/50 transition-colors hover:bg-sf-input/30">
                <td className="px-4 py-3 font-medium text-sf-text">{f.feature}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-sf-purple/10 px-1.5 py-0.5 font-mono text-[9px] text-sf-purple">
                    {f.model}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sf-text-secondary">{formatTokens(f.tokensPerMonth)}</td>
                <td className="px-4 py-3 font-mono text-sf-teal">{formatMoney(f.cost)}</td>
                <td className="px-4 py-3 font-mono text-sf-text">{formatMoney(f.attributedRevenue)}</td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-1 font-mono font-semibold ${f.margin >= 0 ? "text-sf-green" : "text-sf-red"}`}>
                    {f.margin >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {f.margin >= 0 ? "+" : ""}{formatMoney(f.margin)}
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
            value: formatMoney(mockMarginFeatures.reduce((s, f) => s + f.cost, 0)),
            color: "text-sf-teal",
          },
          {
            label: "Total Attributed Rev.",
            value: formatMoney(mockMarginFeatures.reduce((s, f) => s + f.attributedRevenue, 0)),
            color: "text-sf-green",
          },
          {
            label: "Net AI Margin",
            value: formatMoney(mockMarginFeatures.reduce((s, f) => s + f.margin, 0)),
            color:
              mockMarginFeatures.reduce((s, f) => s + f.margin, 0) >= 0
                ? "text-sf-green"
                : "text-sf-red",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-sf-border bg-sf-sidebar p-3.5">
            <div className="font-mono text-[10px] font-medium uppercase tracking-wide text-sf-text-muted">{s.label}</div>
            <div className={`mt-1.5 text-xl font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
