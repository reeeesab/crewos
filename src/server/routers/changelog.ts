import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const changelogRouter = router({
  list: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.changelog.findMany({
        where: { productId: input.productId },
        orderBy: { createdAt: "desc" },
      });
    }),

  generate: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Get closed issues since last changelog or all closed issues if none exist
      const product = await ctx.db.product.findUnique({
        where: { id: input.productId },
        select: { lastChangelogAt: true },
      });

      const issues = await ctx.db.issue.findMany({
        where: {
          productId: input.productId,
          status: "CLOSED",
          closedAt: {
            gt: product?.lastChangelogAt || new Date(0),
          },
        },
      });

      if (issues.length === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No new closed issues to generate a changelog from.",
        });
      }

      // 2. Prepare prompt for AI
      const issueSummary = issues
        .map((i) => `- [${i.type}] ${i.title}: ${i.description || "No description"}`)
        .join("\n");

      let title = "New Updates";
      let body = "We've been working hard to improve your experience. Here are the latest changes.";

      if (anthropic) {
        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: `You are a professional SaaS founder writing a changelog. 
                Based on these closed issues, write a short, punchy changelog entry.
                Include a catchy title and a bulleted list of changes.
                Keep it professional but friendly.
                
                Issues:
                ${issueSummary}
                
                You MUST respond with ONLY valid JSON, nothing else: { "title": "...", "body": "..." }`,
              },
            ],
          });

          const content = response.content[0];
          if (content.type === "text") {
             // Try to extract JSON from the response (handle markdown code blocks)
             let jsonText = content.text.trim();
             const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
             if (jsonMatch) jsonText = jsonMatch[0];
             const parsed = JSON.parse(jsonText);
             title = parsed.title;
             body = parsed.body;
          }
        } catch (error: any) {
          console.error("Anthropic changelog error:", error?.message || error);
          // Use fallback with actual issue content
          title = `Updates — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
          body = `We've completed ${issues.length} item${issues.length > 1 ? "s" : ""}:\n\n${issues.map(i => `• **[${i.type}]** ${i.title}`).join("\n")}`;
        }
      } else {
        // Mock fallback if no API key
        title = `Updates for ${new Date().toLocaleDateString()}`;
        body = `We've completed ${issues.length} tasks:\n\n${issueSummary}`;
      }

      // 3. Create Draft
      const changelog = await ctx.db.changelog.create({
        data: {
          productId: input.productId,
          title,
          body,
          type: "SHIPPED",
          status: "DRAFT",
        },
      });

      return changelog;
    }),

  publish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const changelog = await ctx.db.changelog.update({
        where: { id: input.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      // Update product's lastChangelogAt
      await ctx.db.product.update({
        where: { id: changelog.productId },
        data: { lastChangelogAt: new Date() },
      });

      return changelog;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
      type: z.enum(["SHIPPED", "BUGFIX", "IMPROVEMENT"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.changelog.update({
        where: { id: input.id },
        data: {
          title: input.title,
          body: input.body,
          type: input.type,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.changelog.delete({
        where: { id: input.id },
      });
    }),
});
