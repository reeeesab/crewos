import { Resend } from "resend";
import type { IntegrationConfig, PrismaClient, RevenueProvider } from "@prisma/client";

type DunningEmailStage = 1 | 2 | 3;

const DEFAULT_STAGE_SUBJECTS: Record<DunningEmailStage, string> = {
  1: "Payment failed — quick fix inside",
  2: "Your access is at risk (payment retry pending)",
  3: "Final reminder: update payment method",
};

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
}

function stageCopy(stage: DunningEmailStage, productName: string, amountFormatted: string) {
  if (stage === 1) {
    return {
      body: `Your payment of ${amountFormatted} for ${productName} didn't go through. This is usually a card expiration or bank-side block. Update your billing method and we'll retry automatically.`,
      cta: "Update Billing Method",
    };
  }

  if (stage === 2) {
    return {
      body: `Still unpaid: ${amountFormatted} for ${productName}. You're at risk of service interruption. A quick payment method update usually resolves this in under a minute.`,
      cta: "Fix Payment Now",
    };
  }

  return {
    body: `Final reminder: ${productName} billing issue is still open. This is the last recovery email from CrewOS before this invoice is marked unresolved. Update your card to avoid disruption.`,
    cta: "Resolve Payment",
  };
}

function buildEmailHtml({
  customerName,
  productName,
  stage,
  bodyText,
  paymentUrl,
}: {
  customerName?: string | null;
  productName: string;
  stage: DunningEmailStage;
  bodyText: string;
  paymentUrl?: string | null;
}) {
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
  const ctaUrl = paymentUrl ?? "#";
  const cta = stageCopy(stage, productName, "").cta;

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#0f172a;">
      <p style="font-size:14px;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:#334155;">${bodyText}</p>
      <a href="${ctaUrl}" style="display:inline-block;background:#06b6d4;color:#00131a;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">
        ${cta}
      </a>
      <p style="font-size:12px;line-height:1.5;color:#64748b;margin:18px 0 0;">
        Sent by CrewOS automated recovery. If you've already updated payment details, you can ignore this message.
      </p>
    </div>
  `;
}

function getTemplateValue(
  integration: Pick<
    IntegrationConfig,
    | "dunningEmail1Subject"
    | "dunningEmail1Body"
    | "dunningEmail2Subject"
    | "dunningEmail2Body"
    | "dunningEmail3Subject"
    | "dunningEmail3Body"
  >,
  stage: DunningEmailStage,
) {
  const amountPlaceholder = "{{amount}}";
  const productPlaceholder = "{{productName}}";

  const fallback = {
    subject: DEFAULT_STAGE_SUBJECTS[stage],
    body:
      stage === 1
        ? `Your payment of ${amountPlaceholder} for ${productPlaceholder} didn't go through. This is usually a card expiration or bank-side block. Update your billing method and we'll retry automatically.`
        : stage === 2
          ? `Still unpaid: ${amountPlaceholder} for ${productPlaceholder}. You're at risk of service interruption. A quick payment method update usually resolves this in under a minute.`
          : `Final reminder: ${productPlaceholder} billing issue is still open. This is the last recovery email from CrewOS before this invoice is marked unresolved. Update your card to avoid disruption.`,
  };

  if (stage === 1) {
    return {
      subject: integration.dunningEmail1Subject?.trim() || fallback.subject,
      body: integration.dunningEmail1Body?.trim() || fallback.body,
    };
  }
  if (stage === 2) {
    return {
      subject: integration.dunningEmail2Subject?.trim() || fallback.subject,
      body: integration.dunningEmail2Body?.trim() || fallback.body,
    };
  }
  return {
    subject: integration.dunningEmail3Subject?.trim() || fallback.subject,
    body: integration.dunningEmail3Body?.trim() || fallback.body,
  };
}

function applyTemplatePlaceholders(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");
}

async function sendRecoveryEmail({
  to,
  fromEmail,
  senderName,
  replyTo,
  stage,
  productName,
  amountCents,
  currency,
  customerName,
  paymentUrl,
  customSubject,
  customBody,
}: {
  to: string;
  fromEmail: string;
  senderName?: string | null;
  replyTo?: string | null;
  stage: DunningEmailStage;
  productName: string;
  amountCents: number;
  currency: string;
  customerName?: string | null;
  paymentUrl?: string | null;
  customSubject?: string | null;
  customBody?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, reason: "missing_resend_key" as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const amountFormatted = formatMoney(amountCents, currency);
  const fromName = senderName?.trim() || "CrewOS";
  const from = `${fromName} <${fromEmail}>`;
  const copy = stageCopy(stage, productName, amountFormatted);
  const subject = customSubject?.trim() || DEFAULT_STAGE_SUBJECTS[stage];
  const bodyText = customBody?.trim() || copy.body;

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html: buildEmailHtml({
        customerName,
        productName,
        stage,
        bodyText,
        paymentUrl,
      }),
      replyTo: replyTo || undefined,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("[Dunning] Email send failed:", error);
    return { sent: false, reason: "send_failed" as const };
  }
}

export async function handleFailedPayment({
  db,
  productId,
  provider,
  providerInvoiceId,
  customerEmail,
  customerName,
  customerId,
  amountCents,
  currency,
  paymentUrl,
}: {
  db: PrismaClient;
  productId: string;
  provider: RevenueProvider;
  providerInvoiceId: string;
  customerEmail?: string | null;
  customerName?: string | null;
  customerId?: string | null;
  amountCents: number;
  currency?: string | null;
  paymentUrl?: string | null;
}) {
  const integration = await db.integrationConfig.findUnique({
    where: { productId },
    include: { product: { select: { name: true } } },
  });
  if (!integration || !integration.dunningEnabled) {
    return { ok: false, reason: "dunning_disabled" as const };
  }
  if (!integration.dunningFromEmail || !customerEmail) {
    return { ok: false, reason: "missing_email_data" as const };
  }

  const key = {
    productId_provider_providerInvoiceId: {
      productId,
      provider,
      providerInvoiceId,
    },
  };
  const existing = await db.dunningAttempt.findUnique({ where: key });
  if (existing?.status === "RECOVERED" || existing?.status === "CLOSED") {
    return { ok: true, skipped: "already_closed" as const };
  }

  const now = new Date();
  const failedCount = (existing?.failedCount ?? 0) + 1;
  const emailsSent = existing?.emailsSent ?? 0;
  const stage = Math.min(emailsSent + 1, 3) as DunningEmailStage;

  const recentlyEmailed =
    existing?.lastEmailSentAt &&
    now.getTime() - existing.lastEmailSentAt.getTime() < 30 * 60 * 1000;

  let sent = false;
  if (!recentlyEmailed && emailsSent < 3) {
    const template = getTemplateValue(integration, stage);
    const amountFormatted = formatMoney(amountCents, currency ?? "USD");
    const result = await sendRecoveryEmail({
      to: customerEmail,
      fromEmail: integration.dunningFromEmail,
      senderName: integration.dunningSenderName,
      replyTo: integration.dunningReplyTo,
      stage,
      productName: integration.product.name,
      amountCents,
      currency: currency ?? "USD",
      customerName,
      paymentUrl,
      customSubject: applyTemplatePlaceholders(template.subject, {
        productName: integration.product.name,
        amount: amountFormatted,
      }),
      customBody: applyTemplatePlaceholders(template.body, {
        productName: integration.product.name,
        amount: amountFormatted,
      }),
    });
    sent = result.sent;
  }

  if (!existing) {
    await db.dunningAttempt.create({
      data: {
        productId,
        provider,
        providerInvoiceId,
        customerId,
        customerEmail,
        customerName,
        amountCents,
        currency: (currency ?? "USD").toUpperCase(),
        paymentUrl,
        failedCount,
        emailsSent: sent ? 1 : 0,
        lastEmailSentAt: sent ? now : null,
        status: "FAILED",
      },
    });
  } else {
    await db.dunningAttempt.update({
      where: key,
      data: {
        customerEmail,
        customerName,
        customerId,
        amountCents,
        currency: (currency ?? "USD").toUpperCase(),
        paymentUrl,
        failedCount,
        lastFailedAt: now,
        emailsSent: sent ? existing.emailsSent + 1 : existing.emailsSent,
        lastEmailSentAt: sent ? now : existing.lastEmailSentAt,
      },
    });
  }

  const preferences = await db.notificationPreference.findUnique({ where: { productId } });
  if (preferences?.paymentFailedEnabled ?? true) {
    await db.notificationEvent.create({
      data: {
        productId,
        type: "payment_failed",
        title: "Payment failed",
        message: `${customerEmail} invoice ${providerInvoiceId} failed (${formatMoney(amountCents, currency ?? "USD")}).`,
        severity: "warning",
      },
    });
  }

  return { ok: true, emailSent: sent, stage: sent ? stage : null };
}

export async function handleRecoveredPayment({
  db,
  productId,
  provider,
  providerInvoiceId,
}: {
  db: PrismaClient;
  productId: string;
  provider: RevenueProvider;
  providerInvoiceId: string;
}) {
  const attempt = await db.dunningAttempt.findUnique({
    where: {
      productId_provider_providerInvoiceId: {
        productId,
        provider,
        providerInvoiceId,
      },
    },
  });
  if (!attempt || attempt.status === "RECOVERED") {
    return { recoveredAmountCents: 0 };
  }

  await db.dunningAttempt.update({
    where: {
      productId_provider_providerInvoiceId: {
        productId,
        provider,
        providerInvoiceId,
      },
    },
    data: {
      status: "RECOVERED",
      recoveredAt: new Date(),
    },
  });

  await db.notificationEvent.create({
    data: {
      productId,
      type: "payment_recovered",
      title: "Failed payment recovered",
      message: `Invoice ${providerInvoiceId} was recovered successfully.`,
      severity: "success",
    },
  });

  return { recoveredAmountCents: attempt.amountCents };
}

export function monthlyWindow() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function runDunningFollowups(db: PrismaClient, take = 50) {
  const pending = await db.dunningAttempt.findMany({
    where: {
      status: "FAILED",
      emailsSent: { lt: 3 },
    },
    orderBy: { updatedAt: "asc" },
    take,
  });

  let processed = 0;
  let sent = 0;
  const now = new Date();

  for (const attempt of pending) {
    const last = attempt.lastEmailSentAt ?? attempt.firstFailedAt;
    const waitHours = attempt.emailsSent === 0 ? 0 : attempt.emailsSent === 1 ? 24 : 72;
    const dueAt = new Date(last.getTime() + waitHours * 60 * 60 * 1000);
    if (dueAt > now) continue;

    const integration = await db.integrationConfig.findUnique({
      where: { productId: attempt.productId },
      include: { product: { select: { name: true } } },
    });
    if (!integration?.dunningEnabled || !integration.dunningFromEmail) continue;

    const stage = Math.min(attempt.emailsSent + 1, 3) as DunningEmailStage;
    const template = getTemplateValue(integration, stage);
    const amountFormatted = formatMoney(attempt.amountCents, attempt.currency);
    const result = await sendRecoveryEmail({
      to: attempt.customerEmail,
      fromEmail: integration.dunningFromEmail,
      senderName: integration.dunningSenderName,
      replyTo: integration.dunningReplyTo,
      stage,
      productName: integration.product.name,
      amountCents: attempt.amountCents,
      currency: attempt.currency,
      customerName: attempt.customerName,
      paymentUrl: attempt.paymentUrl,
      customSubject: applyTemplatePlaceholders(template.subject, {
        productName: integration.product.name,
        amount: amountFormatted,
      }),
      customBody: applyTemplatePlaceholders(template.body, {
        productName: integration.product.name,
        amount: amountFormatted,
      }),
    });

    processed += 1;
    if (!result.sent) continue;

    sent += 1;
    await db.dunningAttempt.update({
      where: { id: attempt.id },
      data: {
        emailsSent: attempt.emailsSent + 1,
        lastEmailSentAt: now,
      },
    });
  }

  return { scanned: pending.length, processed, sent };
}
