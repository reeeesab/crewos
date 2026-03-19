import { TRPCError } from "@trpc/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { z } from "zod";
import { assertProductAccess, assertProductRole } from "@/server/lib/access";
import { router, protectedProcedure } from "../trpc";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const changelogRouter = router({
  list: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProductAccess(ctx, input.productId);
      return ctx.db.changelog.findMany({
        where: { productId: input.productId },
        orderBy: { createdAt: "desc" },
      });
    }),

  generate: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertProductRole(ctx, input.productId, ["OWNER", "EDITOR"]);

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

      const issueSummary = issues
        .map((issue) => `- [${issue.type}] ${issue.title}: ${issue.description || "No description"}`)
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
            let jsonText = content.text.trim();
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) jsonText = jsonMatch[0];
            const parsed = JSON.parse(jsonText) as { title: string; body: string };
            title = parsed.title;
            body = parsed.body;
          }
        } catch (error: any) {
          console.error("Anthropic changelog error:", error?.message || error);
          title = `Updates — ${new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}`;
          body = `We've completed ${issues.length} item${issues.length > 1 ? "s" : ""}:\n\n${issues
            .map((issue) => `• **[${issue.type}]** ${issue.title}`)
            .join("\n")}`;
        }
      } else {
        title = `Updates for ${new Date().toLocaleDateString()}`;
        body = `We've completed ${issues.length} tasks:\n\n${issueSummary}`;
      }

      return ctx.db.changelog.create({
        data: {
          productId: input.productId,
          title,
          body,
          type: "SHIPPED",
          status: "DRAFT",
        },
      });
    }),

  publish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.changelog.findUnique({
        where: { id: input.id },
        select: { productId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Changelog not found." });
      await assertProductRole(ctx, existing.productId, ["OWNER", "EDITOR"]);

      const changelog = await ctx.db.changelog.update({
        where: { id: input.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      await ctx.db.product.update({
        where: { id: changelog.productId },
        data: { lastChangelogAt: new Date() },
      });

      return changelog;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        type: z.enum(["SHIPPED", "BUGFIX", "IMPROVEMENT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.changelog.findUnique({
        where: { id: input.id },
        select: { productId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Changelog not found." });
      await assertProductRole(ctx, existing.productId, ["OWNER", "EDITOR"]);

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
      const existing = await ctx.db.changelog.findUnique({
        where: { id: input.id },
        select: { productId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Changelog not found." });
      await assertProductRole(ctx, existing.productId, ["OWNER", "EDITOR"]);

      return ctx.db.changelog.delete({ where: { id: input.id } });
    }),
});
