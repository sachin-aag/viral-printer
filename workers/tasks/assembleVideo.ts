import { task } from "@renderinc/sdk/workflows";
import { buildAssSubtitles } from "@/lib/subtitles";
import type { AudioResult } from "@/lib/types";
import { execSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

export const assembleVideoTask = task(
  { name: "assembleVideo", timeoutSeconds: 300 },
  async function assembleVideo(
    audio: AudioResult,
    bgVideoPaths: string[],
    runId: string
  ): Promise<string> {
    if (bgVideoPaths.length === 0) throw new Error("No background video clips available");

    const workDir = path.join(os.tmpdir(), `vp-${runId}`);
    fs.mkdirSync(workDir, { recursive: true });

    // Use ffprobe for actual audio duration — word timestamps can be shorter than the file
    const realDuration = getAudioDuration(audio.audioPath);
    console.log(`[assembleVideo] clips=${bgVideoPaths.length} duration=${realDuration.toFixed(1)}s`);

    const subsPath = path.join(workDir, "subs.ass");
    fs.writeFileSync(subsPath, buildAssSubtitles(audio.wordTimestamps));

    const bgPath = bgVideoPaths.length === 1
      ? bgVideoPaths[0]
      : await concatenateClips(bgVideoPaths, workDir, realDuration);

    const outputPath = path.join(workDir, "final.mp4");

    // -t before first -i makes it an INPUT option → finite stream → correct container duration
    // This fixes the "3:47" duration display bug and ensures the video matches audio length
    const dur = (realDuration + 0.5).toFixed(3);
    const ffmpegCmd = [
      "ffmpeg -y",
      `-stream_loop -1 -t ${dur} -i "${bgPath}"`,
      `-i "${audio.audioPath}"`,
      `-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,ass='${subsPath}'"`,
      "-c:v libx264 -preset fast -crf 23",
      "-c:a aac -b:a 192k",
      `-map 0:v -map 1:a`,
      `-t ${dur}`,
      `"${outputPath}"`,
    ].join(" ");

    execSync(ffmpegCmd, { stdio: "pipe" });
    return outputPath;
  }
);

function getAudioDuration(audioPath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
    { encoding: "utf-8" }
  ).trim();
  return parseFloat(out);
}

async function concatenateClips(clips: string[], workDir: string, targetDuration: number): Promise<string> {
  const listFile = path.join(workDir, "clips.txt");
  const entries: string[] = [];
  let total = 0;
  let i = 0;
  while (total < targetDuration + 5) {
    entries.push(`file '${clips[i % clips.length]}'`);
    total += 15;
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
