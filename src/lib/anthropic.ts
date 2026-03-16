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
