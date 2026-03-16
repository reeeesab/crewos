import { type NextRequest, NextResponse } from "next/server";

// Stripe webhook handler
// Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // Dynamic import to avoid server-side errors when not configured
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // syncMRR(event.data.object)
        console.log(`Subscription event: ${event.type}`);
        break;
      case "invoice.payment_failed":
        // flagAtRiskCustomer(event.data.object)
        console.log("Invoice payment failed");
        break;
      case "invoice.payment_succeeded":
        // recordPayment(event.data.object)
        console.log("Invoice payment succeeded");
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
