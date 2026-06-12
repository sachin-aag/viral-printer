import { task } from "@renderinc/sdk/workflows";
import { insertPost } from "@/lib/clickhouse";
import type { PostResult, ScriptResult, HookStyle, VideoMode, Profile } from "@/lib/types";

export const logAnalyticsTask = task(
  { name: "logAnalytics", timeoutSeconds: 30 },
  async function logAnalytics(
    runId: string,
    prompt: string,
    script: ScriptResult,
    hookStyle: HookStyle,
    videoMode: VideoMode,
    profile: Profile,
    postResult: PostResult
  ): Promise<void> {
    console.log(`[logAnalytics] runId=${runId} mock=${postResult.mock}`);
    try {
      await insertPost({
        run_id: runId,
        prompt,
        hook: script.hook,
        hook_style: hookStyle,
        video_mode: videoMode,
        niche: profile.niche,
        tiktok_url: postResult.tiktokUrl ?? "",
        local_video_path: postResult.localVideoPath ?? "",
        status: "completed",
        mock: postResult.mock ? 1 : 0,
      });
    } catch (err) {
      // Analytics failure should not fail the whole pipeline
      console.error("[logAnalytics] insert failed:", err);
    }
  }
);
