/**
 * One-time script: downloads royalty-free "satisfying/hypnotic" clips from Pexels
 * and uploads them to S3 under the brainrot/ prefix.
 *
 * Run: npm run seed:brainrot
 */

import { uploadFile } from "@/lib/s3";
import fs from "fs";
import path from "path";
import os from "os";

const BRAINROT_QUERIES = [
  "satisfying sand",
  "kinetic sand",
  "water flow abstract",
  "colorful slime",
  "geometric abstract loop",
  "neon lights bokeh",
  "soap bubble macro",
];

async function downloadVideo(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
}

async function seedBrainrot() {
  console.log("Seeding brainrot clips to S3...");
  const tmpDir = path.join(os.tmpdir(), "vp-seed");
  fs.mkdirSync(tmpDir, { recursive: true });

  let uploaded = 0;

  for (const query of BRAINROT_QUERIES) {
    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`;
      const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY! } });
      const data = (await res.json()) as { videos?: { video_files: { link: string; quality: string }[] }[] };

      if (!data.videos?.length) {
        console.warn(`No results for: ${query}`);
        continue;
      }

      const videoFile =
        data.videos[0].video_files.find((f) => f.quality === "hd") ??
        data.videos[0].video_files[0];

      const slug = query.replace(/\s+/g, "-");
      const localPath = path.join(tmpDir, `${slug}.mp4`);

      console.log(`Downloading: ${query}...`);
      await downloadVideo(videoFile.link, localPath);

      const s3Key = `brainrot/${slug}.mp4`;
      await uploadFile(localPath, s3Key, "video/mp4");

      console.log(`✓ Uploaded: ${s3Key}`);
      uploaded++;
    } catch (err) {
      console.error(`✗ Failed for "${query}":`, err);
    }
  }

  console.log(`\nDone! ${uploaded}/${BRAINROT_QUERIES.length} clips seeded.`);
}

seedBrainrot().catch(console.error);
