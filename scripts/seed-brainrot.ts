/**
 * One-time script: downloads royalty-free "satisfying/hypnotic" clips from Pexels
 * and uploads them to S3 under the brainrot/ prefix.
 *
 * Run: npm run seed:brainrot
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { uploadFile } from "@/lib/s3";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";

const BRAINROT_QUERIES = [
  // Satisfying / ASMR
  "kinetic sand satisfying",
  "slime satisfying close up",
  "pressure washing satisfying",
  "cutting kinetic sand",
  // Abstract / visual
  "neon lights bokeh abstract",
  "colorful paint pour abstract",
  "fluid art acrylic pour",
  "geometric kaleidoscope loop",
  // Nature hypnotic
  "ocean waves close up slow motion",
  "fire flames close up",
  "rain drops window",
  "lava flow slow motion",
  // City / urban
  "city traffic timelapse aerial",
  "neon city night rainy",
  "subway train timelapse",
  // Food / texture
  "melting chocolate slow motion",
  "honey drip macro",
  "glitter falling slow motion",
  // Retro / tech
  "retro wave synthwave loop",
  "binary code matrix",
];

async function downloadAndNormalize(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const rawPath = destPath.replace(".mp4", "_raw.mp4");
  fs.writeFileSync(rawPath, Buffer.from(buf));
  // Normalize: strip corrupt duration metadata, cap at 30s, portrait crop
  execSync(
    `ffmpeg -y -i "${rawPath}" -c:v libx264 -preset ultrafast -crf 26 -an -t 30 "${destPath}"`,
    { stdio: "pipe" }
  );
  fs.unlinkSync(rawPath);
}

async function seedBrainrot() {
  console.log("Seeding brainrot clips to S3...");
  const tmpDir = path.join(os.tmpdir(), "vp-seed");
  fs.mkdirSync(tmpDir, { recursive: true });

  let uploaded = 0;

  for (const query of BRAINROT_QUERIES) {
    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=2&orientation=portrait`;
      const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY! } });
      const data = (await res.json()) as { videos?: { video_files: { link: string; quality: string }[] }[] };

      if (!data.videos?.length) {
        console.warn(`No results for: ${query}`);
        continue;
      }

      const slug = query.replace(/\s+/g, "-");

      for (let vi = 0; vi < Math.min(data.videos.length, 2); vi++) {
        const videoFile =
          data.videos[vi].video_files.find((f) => f.quality === "hd") ??
          data.videos[vi].video_files.find((f) => f.quality === "sd") ??
          data.videos[vi].video_files[0];
        if (!videoFile?.link) continue;

        const localPath = path.join(tmpDir, `${slug}-${vi}.mp4`);
        const s3Key = `brainrot/${slug}-${vi}.mp4`;

        console.log(`Downloading: ${query} [${vi}]...`);
        try {
          await downloadAndNormalize(videoFile.link, localPath);
          await uploadFile(localPath, s3Key, "video/mp4");
          console.log(`✓ Uploaded: ${s3Key}`);
          uploaded++;
        } catch (err) {
          console.error(`✗ clip ${vi} for "${query}":`, err);
        }
      }
    } catch (err) {
      console.error(`✗ Failed for "${query}":`, err);
    }
  }

  console.log(`\nDone! ${uploaded}/${BRAINROT_QUERIES.length * 2} clips seeded.`);
}

seedBrainrot().catch(console.error);
