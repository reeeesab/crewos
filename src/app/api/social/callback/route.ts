import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateBase64 = searchParams.get("state");

  if (!code || !stateBase64) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    const { productId, platform } = JSON.parse(Buffer.from(stateBase64, "base64").toString());
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/social/callback`;

    let accessToken = "";
    let refreshToken = "";
    let expiresAt: Date | null = null;
    let handle = "";

    if (platform === "twitter") {
      const response = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code_verifier: "challenge",
        }),
      });
      const data = await response.json();
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      expiresAt = new Date(Date.now() + data.expires_in * 1000);

      const userResponse = await fetch("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userResponse.json();
      handle = `@${userData.data.username}`;
    } else if (platform === "linkedin") {
       const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      });
      const data = await response.json();
      accessToken = data.access_token;
      expiresAt = new Date(Date.now() + data.expires_in * 1000);

      const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userResponse.json();
      handle = userData.name;
    } else if (platform === "threads") {
       const response = await fetch("https://graph.threads.net/oauth/access_token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: process.env.THREADS_CLIENT_ID!,
          client_secret: process.env.THREADS_CLIENT_SECRET!,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      });
      const data = await response.json();
      accessToken = data.access_token;
      // Threads tokens need to be exchanged for long-lived ones if needed
      
      const userResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=username&access_token=${accessToken}`);
      const userData = await userResponse.json();
      handle = `@${userData.username}`;
    }

    await db.socialAccount.upsert({
      where: {
        productId_platform_handle: {
          productId,
          platform,
          handle,
        },
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt,
        lastSyncedAt: new Date(),
      },
      create: {
        productId,
        platform,
        handle,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return NextResponse.redirect(`${baseUrl}/${productId}/build-in-public?connected=true`);
  } catch (error) {
    console.error("Social callback error:", error);
    return NextResponse.json({ error: "Failed to connect account" }, { status: 500 });
  }
}
