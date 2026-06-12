import { task } from "@renderinc/sdk/workflows";
import { generateAudio as pollyGenerateAudio } from "@/lib/polly";
import { generateAudio as elevenLabsGenerateAudio } from "@/lib/elevenlabs";
import type { AudioResult, TtsProvider } from "@/lib/types";
import os from "os";
import path from "path";
import fs from "fs";

export const generateAudioTask = task(
  { name: "generateAudio", timeoutSeconds: 60 },
  async function generateAudio(
    text: string,
    voiceId: string,
    ttsProvider: TtsProvider,
    runId: string
  ): Promise<AudioResult> {
    console.log(`[generateAudio] provider=${ttsProvider} voiceId=${voiceId}`);
    const outputDir = path.join(os.tmpdir(), `vp-${runId}`);
    fs.mkdirSync(outputDir, { recursive: true });

    if (ttsProvider === "elevenlabs") {
      return elevenLabsGenerateAudio(text, voiceId, outputDir);
    }
    return pollyGenerateAudio(text, voiceId, outputDir);
  }
);
