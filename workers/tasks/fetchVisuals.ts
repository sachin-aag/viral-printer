import { task } from "@renderinc/sdk/workflows";
import { listBrainrotClips, downloadFile } from "@/lib/s3";
import type { VideoMode } from "@/lib/types";
import { execSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

export const fetchVisualsTask = task(
  { name: "fetchVisuals", timeoutSeconds: 120 },
  async function fetchVisuals(
    topic: string,
    videoMode: VideoMode,
    durationSeconds: number,
    runId: string
  ): Promise<string[]> {
    console.log(`[fetchVisuals] mode=${videoMode} topic="${topic}" duration=${durationSeconds}s`);
    const outputDir = path.join(os.tmpdir(), `vp-${runId}`);
    fs.mkdirSync(outputDir, { recursive: true });

    if (videoMode === "brainrot") {
      return fetchBrainrotClips(outputDir, durationSeconds);
    } else {
      return fetchBrollClips(topic, outputDir, durationSeconds);
    }
  }
);

async function fetchBrainrotClips(outputDir: string, durationSeconds: number): Promise<string[]> {
  const clips = await listBrainrotClips();
  if (clips.length === 0) {
    console.log("[fetchVisuals] No brainrot clips in S3 — falling back to b-roll");
    return fetchBrollClips("satisfying abstract", outputDir, durationSeconds);
  }

  const picked = shuffleArray(clips).slice(0, Math.ceil(durationSeconds / 15) + 1);
  const paths: string[] = [];
  for (let i = 0; i < picked.length; i++) {
    const destPath = path.join(outputDir, `bg-${i}.mp4`);
    await downloadFile(picked[i], destPath);
    paths.push(destPath);
  }
  return paths;
}

// Ordered fallback topics — tried in sequence until we get clips
const FALLBACK_TOPICS = ["nature abstract", "city timelapse", "ocean waves", "technology"];

async function fetchBrollClips(
  topic: string,
  outputDir: string,
  durationSeconds: number,
  _fallbackIdx = 0
): Promise<string[]> {
  const perPage = Math.min(5, Math.ceil(durationSeconds / 10) + 1);
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(topic)}&per_page=${perPage}&orientation=portrait`;

  const response = await fetch(url, {
    headers: { Authorization: process.env.PEXELS_API_KEY! },
  });

  if (!response.ok) throw new Error(`Pexels API error: ${response.status}`);

  const data = (await response.json()) as { videos: PexelsVideo[] };

  const paths: string[] = [];

  if (data.videos?.length) {
    for (let i = 0; i < Math.min(data.videos.length, perPage); i++) {
      const video = data.videos[i];
      // Pick best available quality — hd preferred, then sd, then anything
      const videoFile =
        video.video_files.find((f) => f.quality === "hd") ??
        video.video_files.find((f) => f.quality === "sd") ??
        video.video_files[0];
      if (!videoFile?.link) continue;

      const destPath = path.join(outputDir, `broll-${i}.mp4`);
      try {
        await downloadVideoFromUrl(videoFile.link, destPath);
        paths.push(destPath);
      } catch {
        console.log(`[fetchVisuals] skipping clip ${i} — download failed`);
      }
    }
  }

  if (paths.length === 0) {
    const nextIdx = _fallbackIdx + 1;
    if (nextIdx < FALLBACK_TOPICS.length) {
      const fallback = FALLBACK_TOPICS[nextIdx - 1] ?? FALLBACK_TOPICS[0];
      console.log(`[fetchVisuals] 0 clips for "${topic}" — trying fallback "${fallback}"`);
      return fetchBrollClips(fallback, outputDir, durationSeconds, nextIdx);
    }
    throw new Error(`Could not fetch any b-roll clips after trying all fallback topics`);
  }

  console.log(`[fetchVisuals] downloaded ${paths.length} clips for "${topic}"`);
  return paths;
}

async function downloadVideoFromUrl(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download video: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const rawPath = destPath.replace(".mp4", "_raw.mp4");
  fs.writeFileSync(rawPath, Buffer.from(buffer));
  // Re-encode to strip corrupt container metadata (Pexels clips often report wrong duration)
  execSync(
    `ffmpeg -y -i "${rawPath}" -c:v libx264 -preset ultrafast -crf 26 -an -t 30 "${destPath}"`,
    { stdio: "pipe" }
  );
  fs.unlinkSync(rawPath);
}

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface PexelsVideoFile {
  link: string;
  quality: string;
  width: number;
  height: number;
}

interface PexelsVideo {
  video_files: PexelsVideoFile[];
}
