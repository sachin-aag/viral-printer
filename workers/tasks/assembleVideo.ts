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
    runId: string,
    speakerVideoPath?: string
  ): Promise<string> {
    if (bgVideoPaths.length === 0) throw new Error("No background video clips available");

    const workDir = path.join(os.tmpdir(), `vp-${runId}`);
    fs.mkdirSync(workDir, { recursive: true });

    const audioDuration = getFileDuration(audio.audioPath);
    const isSpeakerMode = !!speakerVideoPath;
    console.log(`[assembleVideo] clips=${bgVideoPaths.length} audioDuration=${audioDuration.toFixed(1)}s speakerMode=${isSpeakerMode}`);

    const subsPath = path.join(workDir, "subs.ass");
    fs.writeFileSync(subsPath, buildAssSubtitles(audio.wordTimestamps, 1080, 1920, isSpeakerMode));

    const bgPath = buildBackground(bgVideoPaths, workDir, audioDuration);
    const outputPath = path.join(workDir, "final.mp4");
    const dur = (audioDuration + 0.2).toFixed(3);

    let ffmpegCmd: string;

    if (isSpeakerMode) {
      // 50/50 split: brainrot top (960px) + speaker bottom (960px), stacked to 1080x1920
      // Audio comes from input 2 (our TTS), not from the HeyGen video
      ffmpegCmd = [
        "ffmpeg -y",
        `-i "${bgPath}"`,
        `-i "${speakerVideoPath}"`,
        `-i "${audio.audioPath}"`,
        `-filter_complex`,
        `"[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[top];`,
        `[1:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[bottom];`,
        `[top][bottom]vstack=inputs=2[stacked];`,
        `[stacked]ass='${subsPath}'[out]"`,
        `-map "[out]" -map 2:a`,
        "-c:v libx264 -preset fast -crf 23",
        "-c:a aac -b:a 192k",
        `-t ${dur}`,
        `-movflags +faststart`,
        `"${outputPath}"`,
      ].join(" ");
    } else {
      ffmpegCmd = [
        "ffmpeg -y",
        `-i "${bgPath}"`,
        `-i "${audio.audioPath}"`,
        `-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,ass='${subsPath}'"`,
        "-c:v libx264 -preset fast -crf 23",
        "-c:a aac -b:a 192k",
        `-map 0:v -map 1:a`,
        `-t ${dur}`,
        `-movflags +faststart`,
        `"${outputPath}"`,
      ].join(" ");
    }

    execSync(ffmpegCmd, { stdio: "pipe" });

    console.log(`[assembleVideo] output duration=${getFileDuration(outputPath).toFixed(1)}s`);
    return outputPath;
  }
);

/**
 * Build a finite background video long enough to cover audioDuration.
 * Pexels clips often have corrupt duration metadata, so we measure real
 * duration by re-encoding a short probe rather than trusting metadata.
 */
function buildBackground(clips: string[], workDir: string, targetDuration: number): string {
  // Measure actual decodable duration of each clip (decode only, no output)
  const realDurations = clips.map((c, i) => {
    try {
      const out = execSync(
        `ffprobe -v error -count_packets -show_entries stream=nb_read_packets -of csv=p=0 -select_streams v:0 "${c}"`,
        { encoding: "utf-8" }
      ).trim();
      // If packets > 0 but duration seems bogus, fall back to counting frames at 30fps
      const meta = getFileDuration(c);
      if (meta > 3600) {
        // Bogus duration — count frames to estimate real length
        const frames = parseInt(out, 10) || 30;
        return frames / 30;
      }
      return meta;
    } catch {
      return 10;
    }
  });

  console.log(`[assembleVideo] clip real durations: ${realDurations.map((d) => d.toFixed(1)).join(", ")}s`);

  // Repeat clips until we have enough total duration
  const listFile = path.join(workDir, "clips.txt");
  const entries: string[] = [];
  let total = 0;
  let i = 0;
  while (total < targetDuration + 5) {
    const idx = i % clips.length;
    entries.push(`file '${clips[idx]}'`);
    total += realDurations[idx];
    i++;
    // Safety: don't loop more than 50 times
    if (i > 50) break;
  }

  fs.writeFileSync(listFile, entries.join("\n"));

  const concatPath = path.join(workDir, "bg_raw.mp4");
  // Re-encode during concat to normalize framerates and fix any codec issues across clips
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset ultrafast -crf 28 -an "${concatPath}"`,
    { stdio: "pipe" }
  );

  return concatPath;
}

function getFileDuration(filePath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    { encoding: "utf-8" }
  ).trim();
  return parseFloat(out);
}
