import { db } from "@/server/db";

export type SocialPlatform = "twitter" | "linkedin" | "threads";

interface PostResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

export class SocialService {
  private static async getAccessToken(accountId: string): Promise<string | null> {
    const account = await db.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.accessToken) return null;

    // TODO: Implement token refresh logic if account.refreshToken and account.expiresAt are present
    // For now, assume token is valid or handled by the caller
    return account.accessToken;
  }

  static async postToTwitter(accountId: string, text: string): Promise<PostResult> {
    const token = await this.getAccessToken(accountId);
    if (!token) return { success: false, error: "No access token found" };

    try {
      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.detail || response.statusText };
      }

      return { success: true, platformPostId: data.data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async postToLinkedIn(accountId: string, text: string): Promise<PostResult> {
    const token = await this.getAccessToken(accountId);
    if (!token) return { success: false, error: "No access token found" };

    try {
      // First, get the person's URN
      const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userResponse.json();
      const personUrn = userData.sub; // This is a simplified example

      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${personUrn}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || response.statusText };
      }

      return { success: true, platformPostId: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async postToThreads(accountId: string, text: string): Promise<PostResult> {
    const token = await this.getAccessToken(accountId);
    if (!token) return { success: false, error: "No access token found" };

    try {
      // Threads API requires a two-step process: Create Container, then Publish
      // Step 1: Create media container
      const containerResponse = await fetch(`https://graph.threads.net/v1.0/me/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          media_type: "TEXT",
          text: text,
        }),
      });

      const containerData = await containerResponse.json();
      if (!containerResponse.ok) {
        return { success: false, error: containerData.error?.message || "Failed to create Threads container" };
      }

      const creationId = containerData.id;

      // Step 2: Publish the media container
      const publishResponse = await fetch(`https://graph.threads.net/v1.0/me/threads_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          creation_id: creationId,
        }),
      });

      const publishData = await publishResponse.json();
      if (!publishResponse.ok) {
        return { success: false, error: publishData.error?.message || "Failed to publish to Threads" };
      }

      return { success: true, platformPostId: publishData.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  static async dispatchPost(platform: string, accountId: string, text: string): Promise<PostResult> {
    switch (platform.toLowerCase()) {
      case "twitter":
      case "x":
        return this.postToTwitter(accountId, text);
      case "linkedin":
        return this.postToLinkedIn(accountId, text);
      case "threads":
        return this.postToThreads(accountId, text);
      default:
        return { success: false, error: `Unsupported platform: ${platform}` };
    }
  }
}
