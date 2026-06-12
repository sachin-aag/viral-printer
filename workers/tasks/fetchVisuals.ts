import { task } from "@renderinc/sdk/workflows";
import { listBrainrotClips, downloadFile, getPresignedUrl } from "@/lib/s3";
import type { VideoMode } from "@/lib/types";
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
    return fetchBrollClips("satisfying abstract loop", outputDir, durationSeconds);
  }

  // Pick enough clips to cover the duration (each clip ~15-30s, we'll loop in FFmpeg)
  const picked = shuffleArray(clips).slice(0, Math.ceil(durationSeconds / 15) + 1);
  const paths: string[] = [];

  for (let i = 0; i < picked.length; i++) {
    const destPath = path.join(outputDir, `bg-${i}.mp4`);
    await downloadFile(picked[i], destPath);
    paths.push(destPath);
  }

  return paths;
}

async function fetchBrollClips(topic: string, outputDir: string, durationSeconds: number): Promise<string[]> {
  const perPage = Math.min(5, Math.ceil(durationSeconds / 10) + 1);
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(topic)}&per_page=${perPage}&orientation=portrait`;

  const response = await fetch(url, {
    headers: { Authorization: process.env.PEXELS_API_KEY! },
  });

  if (!response.ok) throw new Error(`Pexels API error: ${response.status}`);

  const data = (await response.json()) as { videos: PexelsVideo[] };
  if (!data.videos?.length) {
    // Fallback to generic topic
    return fetchBrollClips("nature abstract", outputDir, durationSeconds);
  }

  const paths: string[] = [];
  for (let i = 0; i < Math.min(data.videos.length, perPage); i++) {
    const video = data.videos[i];
    const videoFile = video.video_files.find((f) => f.quality === "hd" || f.quality === "sd");
    if (!videoFile) continue;

    const destPath = path.join(outputDir, `broll-${i}.mp4`);
    await downloadVideoFromUrl(videoFile.link, destPath);
    paths.push(destPath);
  }

  return paths;
}

async function downloadVideoFromUrl(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download video: ${response.status}`);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
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
