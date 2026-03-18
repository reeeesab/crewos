import { type NextRequest, NextResponse } from "next/server";
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
      provider: "DODO_PAYMENTS",
      eventType: params.eventType,
      status: params.status,
      message: params.message,
    },
  });
}

function readText(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function readNumber(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function isFailedType(type: string) {
  const value = type.toLowerCase();
  return (
    value.includes("payment_failed") ||
    value.includes("payment.failed") ||
    value.includes("invoice.payment_failed") ||
    value.includes("invoice.failed")
  );
}

function isSucceededType(type: string) {
  const value = type.toLowerCase();
  return (
    value.includes("payment_succeeded") ||
    value.includes("payment.succeeded") ||
    value.includes("invoice.payment_succeeded") ||
    value.includes("invoice.paid")
  );
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
      select: { dodoWebhookSecret: true },
    });

    // Dodo webhook auth token (optional but recommended).
    const incomingToken = req.nextUrl.searchParams.get("token");
    if (integration?.dodoWebhookSecret && incomingToken !== integration.dodoWebhookSecret) {
      return NextResponse.json({ error: "Invalid webhook token." }, { status: 401 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const eventType = readText(payload, ["type", "event", "event_type"]) ?? "";
    const isTest = req.nextUrl.searchParams.get("test") === "1";
    const data = (payload.data as Record<string, unknown>) ?? payload;
    const customer = (data.customer as Record<string, unknown>) ?? {};

    const providerInvoiceId =
      readText(data, ["invoice_id", "invoiceId", "payment_id", "paymentId", "id"]) ||
      `dodo-${Date.now()}`;
    const customerEmail =
      readText(data, ["customer_email", "billing_email", "email"]) ||
      readText(customer, ["email"]);
    const customerName = readText(data, ["customer_name", "name"]) || readText(customer, ["name"]);
    const customerId = readText(data, ["customer_id", "customerId"]) || readText(customer, ["id", "customer_id"]);
    const amountCents = readNumber(data, ["amount", "total_amount", "amount_due", "value"]);
    const currency = readText(data, ["currency", "currency_code"]) ?? "USD";
    const paymentUrl = readText(data, ["payment_url", "checkout_url", "invoice_url", "hosted_invoice_url"]);

    if (isFailedType(eventType)) {
      await handleFailedPayment({
        db,
        productId,
        provider: "DODO_PAYMENTS",
        providerInvoiceId,
        customerId,
        customerEmail,
        customerName,
        amountCents: Math.max(0, Math.round(amountCents)),
        currency,
        paymentUrl,
      });
    }

    if (isSucceededType(eventType)) {
      await handleRecoveredPayment({
        db,
        productId,
        provider: "DODO_PAYMENTS",
        providerInvoiceId,
      });
    }

    await logWebhookEvent({
      productId,
      eventType: eventType || "unknown",
      status: "received",
      message: isTest ? "Test event received successfully." : undefined,
    });

    return NextResponse.json({ received: true, test: isTest });
  } catch (error) {
    console.error("[Dodo Webhook] failed:", error);
    const productId = req.nextUrl.searchParams.get("productId");
    if (productId) {
      try {
        await logWebhookEvent({
          productId,
          eventType: "unknown",
          status: "error",
          message: error instanceof Error ? error.message : "Webhook failed",
        });
      } catch {
        // no-op
      }
    }
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
