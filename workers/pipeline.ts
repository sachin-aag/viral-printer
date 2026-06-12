import { task } from "@renderinc/sdk/workflows";
import { generateHookTask } from "./tasks/generateHook";
import { generateScriptTask } from "./tasks/generateScript";
import { generateAudioTask } from "./tasks/generateAudio";
import { fetchVisualsTask } from "./tasks/fetchVisuals";
import { assembleVideoTask } from "./tasks/assembleVideo";
import { uploadToS3Task } from "./tasks/uploadToS3";
import { postToTikTokTask } from "./tasks/postToTikTok";
import { logAnalyticsTask } from "./tasks/logAnalytics";
import type { GenerateRequest, PostResult } from "@/lib/types";

export const tiktokPipelineTask = task(
  { name: "tiktokPipeline", timeoutSeconds: 600 },
  async function tiktokPipeline(request: GenerateRequest, runId: string): Promise<PostResult> {
    const { prompt, hookStyle, videoMode, profile } = request;

    // Step 1: Generate hook
    const hook = await generateHookTask(prompt, hookStyle, profile);

    // Step 2: Generate script
    const script = await generateScriptTask(hook, prompt, profile);

    // Steps 3 & 4: Audio + visuals in parallel
    const [audio, bgPaths] = await Promise.all([
      generateAudioTask(script.fullText, profile.voiceId, profile.ttsProvider, runId),
      fetchVisualsTask(script.topic, videoMode, 60, runId),
    ]);

    // Step 5: Assemble video
    const videoPath = await assembleVideoTask(audio, bgPaths, runId);

    // Step 6: Upload to S3
    const videoUrl = await uploadToS3Task(videoPath, runId);

    // Step 7: Post to TikTok
    const postResult = await postToTikTokTask(videoUrl, script, videoPath);

    // Step 8: Log analytics (non-blocking on failure)
    await logAnalyticsTask(runId, prompt, script, hookStyle, videoMode, profile, postResult);

    return postResult;
  }
);
