import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import Anthropic from "@anthropic-ai/sdk";

export const acquisitionRouter = router({
  generateReport: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findFirst({
        where: { id: input.productId, members: { some: { userId: ctx.user.id } } },
        include: {
          snapshots: { orderBy: { date: "asc" } },
          issues: true,
          costs: true,
          _count: { select: { issues: { where: { status: "CLOSED" } } } },
        },
      });

      if (!product) throw new TRPCError({ code: "NOT_FOUND" });

      const totalCosts = product.costs.reduce((sum, c) => sum + c.amount, 0);
      const openBugs = product.issues.filter((i) => i.type === "BUG" && i.status !== "CLOSED").length;
      const closedIssues = product._count.issues;
      const snapshotCount = product.snapshots.length;
      const latestSnapshot = product.snapshots[product.snapshots.length - 1];
      const earliest = product.snapshots[0];

      // Calculate LTV (simplified: MRR / churnRate * 100)
      const ltv = product.churnRate > 0 ? (product.mrr / (product.churnRate / 100)) : product.mrr * 24;

      // MRR growth rate
      const mrrGrowthPct = earliest && latestSnapshot && earliest.mrr > 0
        ? ((latestSnapshot.mrr - earliest.mrr) / earliest.mrr * 100).toFixed(1)
        : "N/A";

      const dataContext = `
Product: ${product.name}
Status: ${product.status}
Website: ${product.website || "N/A"}
Created: ${product.createdAt.toISOString().split("T")[0]}

REVENUE METRICS:
- Current MRR: $${product.mrr.toLocaleString()}
- Current ARR: $${product.arr.toLocaleString()}
- Active Users: ${product.activeUsers}
- Active Subscriptions: ${product.activeSubscriptions}
- Churn Rate: ${product.churnRate}%
- New MRR: $${product.newMrr}
- Churned MRR: $${product.churnedMrr}
- MRR Growth: ${mrrGrowthPct}%
- Historical Snapshots: ${snapshotCount}
- Estimated LTV: $${ltv.toFixed(0)}

FINANCIAL METRICS:
- Monthly Costs: $${totalCosts.toLocaleString()}
- Net Margin: $${(product.mrr - totalCosts).toFixed(0)}/mo
- Net Margin %: ${product.mrr > 0 ? ((product.mrr - totalCosts) / product.mrr * 100).toFixed(1) : 0}%

PRODUCT HEALTH:
- Health Score: ${product.healthScore}/100
- Open Bugs: ${openBugs}
- Closed Issues: ${closedIssues}
- Total Issues: ${product.issues.length}

COST BREAKDOWN:
${product.costs.map((c) => `- ${c.name} (${c.category}): $${c.amount}/mo`).join("\n")}

MRR HISTORY (last ${Math.min(snapshotCount, 12)} months):
${product.snapshots.slice(-12).map((s) => `- ${new Date(s.date).toISOString().split("T")[0]}: MRR $${s.mrr}, Users ${s.users}, Churn ${s.churn}%`).join("\n")}
`;

      let report: string;

      try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error("No API key");

        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: `You are a SaaS acquisition analyst. Generate a professional acquisition readiness report for a potential buyer on Acquire.com or MicroAcquire. Use this data:

${dataContext}

Format the report as follows (use HTML for formatting, no markdown):
1. <h1>Acquisition Readiness Report</h1>
2. <h2>Executive Summary</h2> - 2-3 paragraph overview of the business
3. <h2>Revenue Analysis</h2> - MRR trends, ARR, growth trajectory, seasonality
4. <h2>Customer Metrics</h2> - Churn analysis, LTV, subscriptions, retention
5. <h2>Financial Health</h2> - Cost breakdown, margins, profitability analysis
6. <h2>Product Quality</h2> - Health score analysis, bug velocity, development activity
7. <h2>Growth Opportunities</h2> - Recommendations for buyer
8. <h2>Risk Assessment</h2> - Red flags and risk factors
9. <h2>Valuation Indicators</h2> - Multiple ranges (3-5x ARR for SaaS), comparable benchmarks
10. <h2>Acquisition Readiness Score</h2> - Score out of 100 with breakdown

Use professional, data-driven language. Include specific numbers throughout. Use <table> for data comparisons. Use <strong> for emphasis. Make it look like a report from a professional due diligence firm.`
          }],
        });

        report = (response.content[0] as any).text;
      } catch {
        // Fallback: structured report without AI
        report = `
<h1>Acquisition Readiness Report</h1>
<p><strong>${product.name}</strong> — Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

<h2>Executive Summary</h2>
<p>${product.name} is a ${product.status.toLowerCase()} SaaS product with <strong>$${product.mrr.toLocaleString()} MRR</strong> ($${product.arr.toLocaleString()} ARR) and ${product.activeUsers} active users. The business has a churn rate of ${product.churnRate}% and an estimated customer LTV of $${ltv.toFixed(0)}.</p>

<h2>Revenue Metrics</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
<tr><th>Metric</th><th>Value</th></tr>
<tr><td>MRR</td><td>$${product.mrr.toLocaleString()}</td></tr>
<tr><td>ARR</td><td>$${product.arr.toLocaleString()}</td></tr>
<tr><td>MRR Growth</td><td>${mrrGrowthPct}%</td></tr>
<tr><td>Active Subscriptions</td><td>${product.activeSubscriptions}</td></tr>
<tr><td>Churn Rate</td><td>${product.churnRate}%</td></tr>
<tr><td>Estimated LTV</td><td>$${ltv.toFixed(0)}</td></tr>
</table>

<h2>Financial Health</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
<tr><th>Category</th><th>Monthly Cost</th></tr>
${product.costs.map((c) => `<tr><td>${c.name} (${c.category})</td><td>$${c.amount}</td></tr>`).join("")}
<tr><td><strong>Total</strong></td><td><strong>$${totalCosts}</strong></td></tr>
<tr><td><strong>Net Margin</strong></td><td><strong>$${(product.mrr - totalCosts).toFixed(0)}/mo</strong></td></tr>
</table>

<h2>Product Quality</h2>
<p>Health Score: <strong>${product.healthScore}/100</strong> | Open Bugs: ${openBugs} | Resolved Issues: ${closedIssues}</p>

<h2>Valuation Indicators</h2>
<p>Based on a 3-5x ARR multiple: <strong>$${(product.arr * 3).toLocaleString()} — $${(product.arr * 5).toLocaleString()}</strong></p>
`;
      }

      return { report, generatedAt: new Date().toISOString() };
    }),
});
