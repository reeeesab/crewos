import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getDb } from "@/server/db";
import { handleFailedPayment, handleRecoveredPayment } from "@/server/services/dunning";

async function logWebhookEvent(params: {
  productId: string;
  eventType: string;
  status: string;
  message?: string;
}) {
  const db = getDb();
  await db.webhookEvent.create({
    data: {
      productId: params.productId,
      provider: "STRIPE",
      eventType: params.eventType,
      status: params.status,
      message: params.message,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "Missing productId query param." }, { status: 400 });
    }

    const db = getDb();
    const integration = await db.integrationConfig.findUnique({
      where: { productId },
      select: { stripeWebhookSecret: true, stripeApiKey: true },
    });
    const webhookSecret = integration?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    const stripeKey = integration?.stripeApiKey || process.env.STRIPE_SECRET_KEY;

    const isTest = req.nextUrl.searchParams.get("test") === "1";
    const testToken = req.nextUrl.searchParams.get("token");
    let eventType = "unknown";

    if (isTest) {
      if (!integration?.stripeWebhookSecret || testToken !== integration.stripeWebhookSecret) {
        await logWebhookEvent({
          productId,
          eventType: "test",
          status: "error",
          message: "Invalid test token",
        });
        return NextResponse.json({ error: "Invalid test token." }, { status: 401 });
      }

      const payload = (await req.json()) as {
        type: "invoice.payment_failed" | "invoice.payment_succeeded";
        data?: Record<string, unknown>;
      };
      eventType = payload.type;

      const invoice = payload.data ?? {};
      const invoiceId = String(invoice.id || `test-${Date.now()}`);
      const amountCents = Number(invoice.amount_due || invoice.total || 2900);
      const customerEmail = String(invoice.customer_email || "test-customer@example.com");

      if (payload.type === "invoice.payment_failed") {
        await handleFailedPayment({
          db,
          productId,
          provider: "STRIPE",
          providerInvoiceId: invoiceId,
          customerId: String(invoice.customer || "cus_test"),
          customerEmail,
          customerName: String(invoice.customer_name || "Test Customer"),
          amountCents: Math.max(0, Math.round(amountCents)),
          currency: String(invoice.currency || "USD"),
          paymentUrl: String(invoice.hosted_invoice_url || ""),
        });
      } else {
        await handleRecoveredPayment({
          db,
          productId,
          provider: "STRIPE",
          providerInvoiceId: invoiceId,
        });
      }

      await logWebhookEvent({
        productId,
        eventType,
        status: "received",
        message: "Test event received successfully.",
      });
      return NextResponse.json({ received: true, test: true });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!webhookSecret || !signature || !stripeKey) {
      return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
    }

    const stripeModule = await import("stripe");
    const StripeCtor = stripeModule.default;
    const stripe = new StripeCtor(stripeKey);

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    eventType = event.type;

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const amountCents =
        Math.max(invoice.amount_due ?? 0, invoice.amount_remaining ?? 0, invoice.total ?? 0) || 0;
      await handleFailedPayment({
        db,
        productId,
        provider: "STRIPE",
        providerInvoiceId: invoice.id,
        customerId: typeof invoice.customer === "string" ? invoice.customer : null,
        customerEmail: invoice.customer_email,
        customerName: invoice.customer_name,
        amountCents,
        currency: (invoice.currency || "usd").toUpperCase(),
        paymentUrl: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
      });
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      await handleRecoveredPayment({
        db,
        productId,
        provider: "STRIPE",
        providerInvoiceId: invoice.id,
      });
    }

    await logWebhookEvent({
      productId,
      eventType,
      status: "received",
    });
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    const productId = req.nextUrl.searchParams.get("productId");
    if (productId) {
      try {
        await logWebhookEvent({
          productId,
          eventType: "unknown",
          status: "error",
          message: err instanceof Error ? err.message : "Webhook failed",
        });
      } catch {
        // no-op
      }
    }
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
