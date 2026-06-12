import { task } from "@renderinc/sdk/workflows";
import { uploadAudio } from "@/lib/s3";
import { generateSpeakerVideo } from "@/lib/heygen";
import type { AudioResult } from "@/lib/types";
import os from "os";
import path from "path";
import fs from "fs";

export const generateSpeakerVideoTask = task(
  { name: "generateSpeakerVideo", timeoutSeconds: 360 },
  async function generateSpeakerVideoFn(
    audio: AudioResult,
    avatarId: string,
    runId: string
  ): Promise<string> {
    console.log(`[generateSpeakerVideo] avatarId=${avatarId} duration=${audio.durationSeconds.toFixed(1)}s`);

    const workDir = path.join(os.tmpdir(), `vp-${runId}`);
    fs.mkdirSync(workDir, { recursive: true });

    // HeyGen needs a public URL to fetch the audio — upload to S3 first
    const audioUrl = await uploadAudio(audio.audioPath, runId);
    console.log(`[generateSpeakerVideo] audio uploaded to S3: ${audioUrl}`);

    const outputPath = path.join(workDir, "speaker.mp4");
    await generateSpeakerVideo(avatarId, audioUrl, outputPath);

    return outputPath;
  }
);
