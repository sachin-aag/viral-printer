import { task } from "@renderinc/sdk/workflows";
import type { PostResult, ScriptResult } from "@/lib/types";

export const postToTikTokTask = task(
  { name: "postToTikTok", timeoutSeconds: 120, retry: { maxRetries: 2, waitDurationMs: 5000 } },
  async function postToTikTok(
    videoUrl: string,
    script: ScriptResult,
    localVideoPath: string
  ): Promise<PostResult> {
    const entityId = process.env.COMPOSIO_TIKTOK_ENTITY_ID;

    if (!entityId) {
      console.log("[postToTikTok] COMPOSIO_TIKTOK_ENTITY_ID not set — running in mock mode");
      return { mock: true, localVideoPath };
    }

    console.log(`[postToTikTok] posting via Composio entityId=${entityId}`);

    const { OpenAIToolSet } = await import("composio-core");
    const toolset = new OpenAIToolSet({ apiKey: process.env.COMPOSIO_API_KEY! });

    const title = `${script.hook}\n\n${script.hashtags.map((h) => `#${h}`).join(" ")}`;

    const result = await toolset.executeAction({
      action: "TIKTOK_POST_VIDEO_URL",
      params: {
        video_url: videoUrl,
        title: title.slice(0, 150),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      entityId,
    });

    const tiktokUrl = (result as { share_url?: string }).share_url ?? "";
    return { mock: false, tiktokUrl, localVideoPath };
  }
);
