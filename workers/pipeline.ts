import { task } from "@renderinc/sdk/workflows";
import { generateHookTask } from "./tasks/generateHook";
import { generateScriptTask } from "./tasks/generateScript";
import { generateAudioTask } from "./tasks/generateAudio";
import { fetchVisualsTask } from "./tasks/fetchVisuals";
import { assembleVideoTask } from "./tasks/assembleVideo";
import { uploadToS3Task } from "./tasks/uploadToS3";
import { postToTikTokTask } from "./tasks/postToTikTok";
import { logAnalyticsTask } from "./tasks/logAnalytics";
import type { AudioResult, GenerateRequest, PostResult, ScriptResult, StepStatus } from "@/lib/types";

export type PipelineStepUpdate = (stepName: string, status: StepStatus["status"]) => void;

async function runTrackedStep<T>(
  stepName: string,
  onStep: PipelineStepUpdate | undefined,
  work: () => Promise<T>
): Promise<T> {
  onStep?.(stepName, "running");
  try {
    const result = await work();
    onStep?.(stepName, "succeeded");
    return result;
  } catch (error) {
    onStep?.(stepName, "failed");
    throw error;
  }
}

export async function runTikTokPipeline(
  request: GenerateRequest,
  runId: string,
  onStep?: PipelineStepUpdate
): Promise<PostResult> {
  const { prompt, hookStyle, videoMode, profile } = request;

  // Step 1: Generate hook
  const hook = await runTrackedStep("generateHook", onStep, () =>
    generateHookTask(prompt, hookStyle, profile) as Promise<string>
  );

  // Step 2: Generate script
  const script = await runTrackedStep("generateScript", onStep, () =>
    generateScriptTask(hook, prompt, profile) as Promise<ScriptResult>
  );

  // Steps 3 & 4: Audio + visuals in parallel
  onStep?.("generateAudio", "running");
  onStep?.("fetchVisuals", "running");
  const [audio, bgPaths] = await Promise.all([
    (generateAudioTask(
      script.fullText,
      profile.voiceId,
      profile.ttsProvider,
      runId
    ) as Promise<AudioResult>).then(
      (result) => {
        onStep?.("generateAudio", "succeeded");
        return result;
      },
      (error) => {
        onStep?.("generateAudio", "failed");
        throw error;
      }
    ),
    (fetchVisualsTask(script.topic, videoMode, 60, runId) as Promise<string[]>).then(
      (result) => {
        onStep?.("fetchVisuals", "succeeded");
        return result;
      },
      (error) => {
        onStep?.("fetchVisuals", "failed");
        throw error;
      }
    ),
  ]);

  // Step 5: Assemble video
  const videoPath = await runTrackedStep("assembleVideo", onStep, () =>
    assembleVideoTask(audio, bgPaths, runId) as Promise<string>
  );

  // Step 6: Upload to S3
  const videoUrl = await runTrackedStep("uploadToS3", onStep, () =>
    uploadToS3Task(videoPath, runId) as Promise<string>
  );

  // Step 7: Post to TikTok
  const postResult = await runTrackedStep("postToTikTok", onStep, () =>
    postToTikTokTask(videoUrl, script, videoPath) as Promise<PostResult>
  );

  // Step 8: Log analytics
  await runTrackedStep("logAnalytics", onStep, () =>
    logAnalyticsTask(runId, prompt, script, hookStyle, videoMode, profile, postResult) as Promise<void>
  );

  return postResult;
}

export const tiktokPipelineTask = task(
  { name: "tiktokPipeline", timeoutSeconds: 600 },
  async function tiktokPipeline(request: GenerateRequest, runId: string): Promise<PostResult> {
    return runTikTokPipeline(request, runId);
  }
);
