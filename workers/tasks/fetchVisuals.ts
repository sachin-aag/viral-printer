import { task } from "@renderinc/sdk/workflows";
import { listBrainrotClips, downloadFile } from "@/lib/s3";
import type { VideoMode } from "@/lib/types";
import { execSync } from "child_process";
import os from "os";
import path from "path";
import fs from "fs";

export const fetchVisualsTask = task(
  { name: "fetchVisuals", timeoutSeconds: 300 },
  async function fetchVisuals(
    topic: string,
    videoMode: VideoMode,
    durationSeconds: number,
    runId: string,
    transitionDuration = 3
  ): Promise<string[]> {
    console.log(
      `[fetchVisuals] mode=${videoMode} topic="${topic}" duration=${durationSeconds}s transitionDuration=${transitionDuration}s`
    );
    const outputDir = path.join(os.tmpdir(), `vp-${runId}`);
    fs.mkdirSync(outputDir, { recursive: true });

    if (videoMode === "brainrot") {
      return fetchBrainrotClips(outputDir, durationSeconds);
    } else {
      return fetchBrollClips(topic, outputDir, durationSeconds, transitionDuration, runId);
    }
  }
);

async function fetchBrainrotClips(outputDir: string, durationSeconds: number): Promise<string[]> {
  const clips = await listBrainrotClips();
  if (clips.length === 0) {
    console.log("[fetchVisuals] No brainrot clips in S3 — falling back to b-roll");
    return fetchBrollClips("satisfying abstract", outputDir, durationSeconds, 3, "fallback");
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
  transitionDuration: number,
  runId: string,
  _fallbackIdx = 0
): Promise<string[]> {
  const veoCount = process.env.GEMINI_API_KEY ? 2 : 0;

  // Run Pexels + Veo in parallel
  const [pexelsPaths, veoPaths] = await Promise.all([
    fetchFromPexels(topic, outputDir, durationSeconds, transitionDuration, _fallbackIdx),
    generateVeoClips(topic, veoCount, transitionDuration, outputDir, runId),
  ]);

  if (pexelsPaths.length === 0 && veoPaths.length === 0) {
    throw new Error(`Could not fetch any b-roll clips after trying all fallback topics`);
  }

  const mixed = interleave(veoPaths, pexelsPaths);
  console.log(
    `[fetchVisuals] mixed ${mixed.length} clips (${pexelsPaths.length} pexels + ${veoPaths.length} veo) for "${topic}"`
  );
  return mixed;
}

async function fetchFromPexels(
  topic: string,
  outputDir: string,
  durationSeconds: number,
  transitionDuration: number,
  _fallbackIdx = 0
): Promise<string[]> {
  // Fetch roughly half the clips needed — Veo provides the other half
  const perPage = Math.min(15, Math.ceil(durationSeconds / transitionDuration / 2) + 2);
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
      const videoFile =
        video.video_files.find((f) => f.quality === "hd") ??
        video.video_files.find((f) => f.quality === "sd") ??
        video.video_files[0];
      if (!videoFile?.link) continue;

      const destPath = path.join(outputDir, `broll-${i}.mp4`);
      try {
        await downloadVideoFromUrl(videoFile.link, destPath, transitionDuration);
        paths.push(destPath);
      } catch {
        console.log(`[fetchVisuals] skipping pexels clip ${i} — download failed`);
      }
    }
  }

  if (paths.length === 0 && _fallbackIdx < FALLBACK_TOPICS.length) {
    const fallback = FALLBACK_TOPICS[_fallbackIdx];
    console.log(`[fetchVisuals] 0 pexels clips for "${topic}" — trying fallback "${fallback}"`);
    return fetchFromPexels(fallback, outputDir, durationSeconds, transitionDuration, _fallbackIdx + 1);
  }

  return paths;
}

async function generateVeoClips(
  topic: string,
  count: number,
  transitionDuration: number,
  outputDir: string,
  runId: string
): Promise<string[]> {
  if (count === 0 || !process.env.GEMINI_API_KEY) return [];

  // Dynamic import so the module doesn't fail if @google/genai isn't installed
  let GoogleGenAI: typeof import("@google/genai").GoogleGenAI;
  try {
    ({ GoogleGenAI } = await import("@google/genai"));
  } catch {
    console.warn("[fetchVisuals] @google/genai not installed — skipping Veo");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `cinematic vertical b-roll footage of ${topic}, no text, no people faces, smooth motion, 9:16 aspect ratio`;

  const results = await Promise.all(
    Array.from({ length: count }, (_, i) => generateOneVeoClip(ai, prompt, i, transitionDuration, outputDir, runId))
  );

  return results.filter((p): p is string => p !== null);
}

async function generateOneVeoClip(
  ai: InstanceType<typeof import("@google/genai").GoogleGenAI>,
  prompt: string,
  index: number,
  transitionDuration: number,
  outputDir: string,
  runId: string
): Promise<string | null> {
  try {
    console.log(`[fetchVisuals] starting Veo clip ${index}`);

    // Clamp to Veo's supported range (5–8s)
    const veoDuration = Math.max(5, Math.min(8, transitionDuration));

    let operation = await (ai.models as any).generateVideos({
      model: "veo-2.0-generate-001",
      prompt,
      config: {
        numberOfVideos: 1,
        durationSeconds: veoDuration,
        aspectRatio: "9:16",
      },
    });

    // Poll until done (up to ~2 minutes)
    let attempts = 0;
    while (!operation.done && attempts < 24) {
      await new Promise((r) => setTimeout(r, 5000));
      operation = await (ai.operations as any).getVideosOperation({ operation });
      attempts++;
    }

    if (!operation.done) {
      console.warn(`[fetchVisuals] Veo clip ${index} timed out after polling`);
      return null;
    }

    const generatedVideo = operation.response?.generatedVideos?.[0];
    if (!generatedVideo?.video) {
      console.warn(`[fetchVisuals] Veo clip ${index} returned no video`);
      return null;
    }

    // Download video bytes
    const rawPath = path.join(outputDir, `veo-${index}_raw.mp4`);
    const destPath = path.join(outputDir, `veo-${index}.mp4`);

    if (generatedVideo.video.uri) {
      const dlRes = await fetch(generatedVideo.video.uri, {
        headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
      });
      if (!dlRes.ok) throw new Error(`Veo download failed: ${dlRes.status}`);
      const buf = await dlRes.arrayBuffer();
      fs.writeFileSync(rawPath, Buffer.from(buf));
    } else if (generatedVideo.video.videoBytesBase64Encoded) {
      fs.writeFileSync(rawPath, Buffer.from(generatedVideo.video.videoBytesBase64Encoded, "base64"));
    } else {
      console.warn(`[fetchVisuals] Veo clip ${index} has no downloadable bytes`);
      return null;
    }

    // Normalize codec + trim to transitionDuration
    execSync(
      `ffmpeg -y -i "${rawPath}" -c:v libx264 -preset ultrafast -crf 26 -an -t ${transitionDuration} "${destPath}"`,
      { stdio: "pipe" }
    );
    fs.unlinkSync(rawPath);

    console.log(`[fetchVisuals] Veo clip ${index} ready: ${destPath}`);
    return destPath;
  } catch (err) {
    console.warn(`[fetchVisuals] Veo clip ${index} failed:`, err);
    return null;
  }
}

async function downloadVideoFromUrl(
  url: string,
  destPath: string,
  transitionDuration: number
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download video: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const rawPath = destPath.replace(".mp4", "_raw.mp4");
  fs.writeFileSync(rawPath, Buffer.from(buffer));
  // Re-encode to strip corrupt container metadata and trim to transitionDuration
  execSync(
    `ffmpeg -y -i "${rawPath}" -c:v libx264 -preset ultrafast -crf 26 -an -t ${transitionDuration} "${destPath}"`,
    { stdio: "pipe" }
  );
  fs.unlinkSync(rawPath);
}

function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
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
