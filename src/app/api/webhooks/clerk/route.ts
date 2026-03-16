import { type NextRequest, NextResponse } from "next/server";

// Clerk webhook handler for user sync
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { type: string; data: { id: string; email_addresses?: Array<{ email_address: string }> } };

    switch (body.type) {
      case "user.created":
        // Sync new user to DB via Prisma
        console.log("New user created:", body.data.id);
        break;
      case "user.updated":
        console.log("User updated:", body.data.id);
        break;
      case "user.deleted":
        console.log("User deleted:", body.data.id);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
