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
        `-stream_loop -1 -i "${bgPath}"`,
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
        `-stream_loop -1 -i "${bgPath}"`,
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

const XFADE_DURATION = 0.8;

/**
 * Build a finite background video long enough to cover audioDuration.
 * Uses xfade crossfade transitions between clips for smooth scene changes.
 * Pexels clips often have corrupt duration metadata, so we measure real
 * duration by re-encoding a short probe rather than trusting metadata.
 */
function buildBackground(clips: string[], workDir: string, targetDuration: number): string {
  const realDurations = clips.map((c) => {
    try {
      const out = execSync(
        `ffprobe -v error -count_packets -show_entries stream=nb_read_packets -of csv=p=0 -select_streams v:0 "${c}"`,
        { encoding: "utf-8" }
      ).trim();
      const meta = getFileDuration(c);
      if (meta > 3600) {
        const frames = parseInt(out, 10) || 30;
        return frames / 30;
      }
      return meta;
    } catch {
      return 10;
    }
  });

  console.log(`[assembleVideo] clip real durations: ${realDurations.map((d) => d.toFixed(1)).join(", ")}s`);

  // Build ordered list of clips (with repeats) to cover the target duration
  const sequence: { path: string; duration: number }[] = [];
  let total = 0;
  let i = 0;
  while (total < targetDuration + 5) {
    const idx = i % clips.length;
    sequence.push({ path: clips[idx], duration: realDurations[idx] });
    total += realDurations[idx];
    i++;
    if (i > 50) break;
  }

  // Single clip — no transitions needed
  if (sequence.length === 1) {
    const concatPath = path.join(workDir, "bg_raw.mp4");
    execSync(
      `ffmpeg -y -i "${sequence[0].path}" -c:v libx264 -preset ultrafast -crf 28 -an "${concatPath}"`,
      { stdio: "pipe" }
    );
    return concatPath;
  }

  // Normalize all clips to the same resolution/fps first so xfade works
  const normPaths = sequence.map((s, idx) => {
    const np = path.join(workDir, `norm_${idx}.mp4`);
    execSync(
      `ffmpeg -y -i "${s.path}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" -c:v libx264 -preset ultrafast -crf 26 -an "${np}"`,
      { stdio: "pipe" }
    );
    return np;
  });
  const normDurations = normPaths.map((p) => getFileDuration(p));

  // Build xfade filter chain for smooth crossfades between every clip pair
  const inputs = normPaths.map((p) => `-i "${p}"`).join(" ");
  const filters: string[] = [];
  let prevLabel = "[0:v]";
  let offset = normDurations[0] - XFADE_DURATION;

  for (let j = 1; j < normPaths.length; j++) {
    const outLabel = j === normPaths.length - 1 ? "[out]" : `[v${j}]`;
    filters.push(
      `${prevLabel}[${j}:v]xfade=transition=fade:duration=${XFADE_DURATION}:offset=${Math.max(0, offset).toFixed(3)}${outLabel}`
    );
    prevLabel = outLabel;
    if (j < normPaths.length - 1) {
      offset += normDurations[j] - XFADE_DURATION;
    }
  }

  const concatPath = path.join(workDir, "bg_raw.mp4");
  const ffCmd = `ffmpeg -y ${inputs} -filter_complex "${filters.join(";")}" -map "[out]" -c:v libx264 -preset fast -crf 26 -an "${concatPath}"`;
  execSync(ffCmd, { stdio: "pipe" });

  // Clean up normalized intermediates
  normPaths.forEach((p) => { try { fs.unlinkSync(p); } catch {} });

  console.log(`[assembleVideo] background with ${normPaths.length} clips, ${filters.length} crossfades`);
  return concatPath;
}

function getFileDuration(filePath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    { encoding: "utf-8" }
  ).trim();
  return parseFloat(out);
}
