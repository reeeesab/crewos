import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { runDunningFollowups } from "@/server/services/dunning";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const result = await runDunningFollowups(db, 100);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[Dunning Cron] failed:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
