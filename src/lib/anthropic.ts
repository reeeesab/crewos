import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

export async function generateChangelog(issue: {
  type: string;
  title: string;
  description: string;
}) {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are a changelog writer for a SaaS product. Write a concise, friendly changelog entry based on this closed issue.

Issue type: ${issue.type} (FEATURE | BUGFIX | IMPROVEMENT)
Issue title: ${issue.title}
Issue description: ${issue.description}

Rules:
- Title: max 8 words, plain English, no technical jargon
- Body: 2–3 sentences. What changed, what it means for the user, which plans/users it affects.
- Tone: clear, warm, developer-friendly. Not marketing speak.
- Never start with "We" — start with the change itself.
- Output JSON only: { "title": "...", "body": "...", "type": "SHIPPED|BUGFIX|IMPROVEMENT" }`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}

export async function generateBIPPost(data: {
  productName: string;
  type: string;
  title: string;
  platform: string;
}) {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are a ghostwriter for an indie developer who builds in public on social media.

Write a short, authentic post about this recent product update.

Product name: ${data.productName}
Update type: ${data.type} (feature_shipped | bug_fixed)
Update title: ${data.title}
Platform: ${data.platform} (twitter | tiktok | linkedin)

Platform rules:
- Twitter: max 240 chars, casual, end with a question or invite to try it
- TikTok: 150 chars, punchy, trend-aware, relatable founder voice
- LinkedIn: 300 chars, slightly more professional, focus on the lesson or win

Tone: authentic solo founder. Not corporate. No hashtag spam. Real talk about building.
Output only the post text, nothing else.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function generateAnalyticsSummary({
  analytics,
  mrrDelta,
  productName,
}: {
  analytics: {
    totalSessions: number;
    newUsers: number;
    conversionRate: number;
    topSource: string;
    bounceRate: number;
    topCountry: string;
    topCountryPercentage: number;
  };
  mrrDelta: number;
  productName: string;
}): Promise<string> {
  const fallback =
    analytics.topCountry === "India" && analytics.topCountryPercentage >= 25
      ? `${analytics.topCountryPercentage}% of users are from India; add INR pricing and UPI-friendly checkout copy to reduce purchase friction and lift signup-to-paid conversion from this segment.`
      : analytics.conversionRate <= 0.1
        ? `Conversion is ${analytics.conversionRate.toFixed(1)}% from ${analytics.totalSessions} sessions; instrument a GA4 'sign_up' event and optimize your highest-intent source (${analytics.topSource}) to unlock measurable growth.`
        : `Your top source (${analytics.topSource}) is driving demand; create a dedicated landing page for that intent and localize messaging for ${analytics.topCountry} (${analytics.topCountryPercentage}%) to improve conversion.`;

  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: `You are an analytics advisor for indie founders.

Write exactly one sentence for an AI insight banner in ${productName}.

Data:
- Sessions: ${analytics.totalSessions}
- New users: ${analytics.newUsers}
- Signup conversion rate: ${analytics.conversionRate}%
- Top traffic source: ${analytics.topSource}
- Bounce rate: ${analytics.bounceRate}%
- Top country: ${analytics.topCountry} (${analytics.topCountryPercentage}%)
- MRR change this week: ${mrrDelta > 0 ? "+" : ""}${mrrDelta.toFixed(0)} USD

Rules:
- One sentence only.
- Include at least one concrete number from the data.
- Include one specific, founder-actionable recommendation.
- If top country is India and >=25%, suggest INR/localized pricing.
- No bullets, no prefacing text, no markdown.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return fallback;
  const normalized = content.text.trim().replace(/\s+/g, " ");
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0];
  return firstSentence || fallback;
}

export async function generateHealthRecommendations(input: {
  productName: string;
  totalScore: number;
  revenueScore: number;
  productScore: number;
  financialScore: number;
  mrr: number;
  churnRate: number;
  mrrGrowthPct: number | null;
  costRatioPct: number | null;
  netMarginPct: number;
  openBugs: number;
  closedIssueRatePct: number;
  hasRevenueIntegration: boolean;
  costItemsCount: number;
}): Promise<string[]> {
  const fallback: string[] = [];

  if (!input.hasRevenueIntegration || input.mrr <= 0 || input.mrrGrowthPct === null) {
    fallback.push(
      "Connect Stripe or DodoPayment in Settings so CrewOS can track MRR growth and unlock full Revenue Health scoring.",
    );
  }
  if (input.costItemsCount === 0 || input.costRatioPct === null) {
    fallback.push(
      "Add your monthly costs in Cost Tracker to improve Financial Health accuracy and reveal your real net margin.",
    );
  }
  if (input.openBugs > 0) {
    fallback.push(
      `Close at least ${Math.min(input.openBugs, 2)} open bug${input.openBugs > 1 ? "s" : ""} to lift Product Health and improve issue resolution confidence.`,
    );
  }
  if (input.netMarginPct < 40) {
    fallback.push(
      "Your net margin is below the healthy benchmark (>40%); cut non-core costs or raise pricing to move Financial Health into the safe zone.",
    );
  }

  while (fallback.length < 3) {
    fallback.push(
      "Set one weekly health target (revenue, product, or finance) and recalculate after each change to build a clear improvement trend.",
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) return fallback.slice(0, 3);

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 240,
      messages: [
        {
          role: "user",
          content: `You are a SaaS operations advisor for founders.

Write exactly 3 ranked, actionable recommendations for ${input.productName}.

Health data:
- Overall score: ${input.totalScore}/100
- Revenue score: ${input.revenueScore}/40
- Product score: ${input.productScore}/30
- Financial score: ${input.financialScore}/30
- MRR: ${input.mrr}
- Churn rate: ${input.churnRate}%
- MRR growth: ${input.mrrGrowthPct === null ? "N/A" : `${input.mrrGrowthPct.toFixed(1)}%`}
- Cost ratio: ${input.costRatioPct === null ? "N/A" : `${input.costRatioPct.toFixed(1)}%`}
- Net margin: ${input.netMarginPct.toFixed(1)}%
- Open bugs: ${input.openBugs}
- Closed issue rate: ${input.closedIssueRatePct.toFixed(1)}%
- Revenue integration connected: ${input.hasRevenueIntegration ? "yes" : "no"}
- Cost items tracked: ${input.costItemsCount}

Rules:
- Return JSON only in this shape: {"items":["...","...","..."]}.
- Each item must start with a verb.
- Include concrete numbers from the data where relevant.
- Prioritize highest-impact fixes first.
- Keep each item under 24 words.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") return fallback.slice(0, 3);
    const parsed = JSON.parse(content.text) as { items?: unknown };
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((item): item is string => typeof item === "string")
      : [];
    if (items.length >= 2) return items.slice(0, 3);
    return fallback.slice(0, 3);
  } catch {
    return fallback.slice(0, 3);
  }
}
