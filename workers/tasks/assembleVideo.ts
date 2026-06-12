import { task } from "@renderinc/sdk/workflows";
import { buildAssSubtitles } from "@/lib/subtitles";
import type { AudioResult } from "@/lib/types";
import { execSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

export const assembleVideoTask = task(
  { name: "assembleVideo", timeoutSeconds: 300, plan: "starter" },
  async function assembleVideo(
    audio: AudioResult,
    bgVideoPaths: string[],
    runId: string
  ): Promise<string> {
    console.log(`[assembleVideo] clips=${bgVideoPaths.length} duration=${audio.durationSeconds}s`);
    const workDir = path.join(os.tmpdir(), `vp-${runId}`);
    fs.mkdirSync(workDir, { recursive: true });

    const subsPath = path.join(workDir, "subs.ass");
    fs.writeFileSync(subsPath, buildAssSubtitles(audio.wordTimestamps));

    const bgPath = bgVideoPaths.length === 1
      ? bgVideoPaths[0]
      : await concatenateClips(bgVideoPaths, workDir, audio.durationSeconds);

    const outputPath = path.join(workDir, "final.mp4");

    // Scale to 9:16 portrait, overlay audio, burn styled subtitles
    const ffmpegCmd = [
      "ffmpeg -y",
      `-stream_loop -1 -i "${bgPath}"`,
      `-i "${audio.audioPath}"`,
      `-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,ass='${subsPath}'"`,
      `-t ${audio.durationSeconds + 0.5}`,
      "-c:v libx264 -preset fast -crf 23",
      "-c:a aac -b:a 192k",
      `-map 0:v -map 1:a`,
      `-shortest "${outputPath}"`,
    ].join(" ");

    execSync(ffmpegCmd, { stdio: "pipe" });
    return outputPath;
  }
);

async function concatenateClips(clips: string[], workDir: string, targetDuration: number): Promise<string> {
  const listFile = path.join(workDir, "clips.txt");
  // Repeat clips until we have enough duration
  const entries: string[] = [];
  let total = 0;
  let i = 0;
  while (total < targetDuration + 5) {
    const clip = clips[i % clips.length];
    entries.push(`file '${clip}'`);
    total += 15; // estimate 15s per clip; FFmpeg -t will cut off
    i++;
  }
  fs.writeFileSync(listFile, entries.join("\n"));

  const concatPath = path.join(workDir, "bg_concat.mp4");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${concatPath}"`,
    { stdio: "pipe" }
  );
  return concatPath;
}
