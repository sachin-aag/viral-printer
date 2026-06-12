import { task } from "@renderinc/sdk/workflows";
import type { PostResult, ScriptResult } from "@/lib/types";

export const postToTikTokTask = task(
  { name: "postToTikTok", timeoutSeconds: 120, retry: { maxRetries: 2, waitDurationMs: 5000 } },
  async function postToTikTok(
    videoUrl: string,
    script: ScriptResult,
    localVideoPath: string
  ): Promise<PostResult> {
    const connectedAccountId =
      process.env.COMPOSIO_TIKTOK_CONNECTED_ACCOUNT_ID?.trim() ||
      process.env.COMPOSIO_TIKTOK_ENTITY_ID?.trim() ||
      undefined;

    if (!connectedAccountId) {
      console.log("[postToTikTok] COMPOSIO_TIKTOK_CONNECTED_ACCOUNT_ID not set — running in mock mode");
      return { mock: true, tiktokUrl: videoUrl, localVideoPath };
    }

    console.log(`[postToTikTok] posting via Composio connectedAccountId=${connectedAccountId}`);

    const os = await import("os");
    const { Composio } = await import("@composio/core");
    const composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY!,
      toolkitVersions: { tiktok: "00000000_00" },
      dangerouslyAllowAutoUploadDownloadFiles: true,
      fileUploadDirs: [os.tmpdir()],
    });

    const caption = `${script.hook}\n\n${script.hashtags.map((h) => `#${h}`).join(" ")}`.slice(0, 150);

    const account = await composio.connectedAccounts.get(connectedAccountId);
    const userId = (account as { user_id?: string }).user_id ?? "default";
    console.log(`[postToTikTok] resolved userId=${userId}`);

    const result = await composio.tools.execute("TIKTOK_UPLOAD_VIDEO", {
      userId,
      connectedAccountId,
      arguments: {
        file_to_upload: localVideoPath || videoUrl,
        caption,
        publish: true,
      },
    });

    if (!result.successful) {
      throw new Error(`TikTok upload failed: ${result.error ?? "unknown error"}`);
    }

    const data = result.data as {
      publish_id?: string;
      publish_response?: Record<string, unknown> | null;
    };
    console.log(`[postToTikTok] published publish_id=${data.publish_id}`);

    // TikTok's Content Posting API doesn't return a share URL; surface the S3
    // URL so the UI still links to the video.
    return { mock: false, tiktokUrl: videoUrl, localVideoPath };
  }
);
