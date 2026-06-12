import fs from "fs";
import path from "path";

const HEYGEN_API = "https://api.heygen.com";
const HEYGEN_UPLOAD = "https://upload.heygen.com";

function apiKey() {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY is not set");
  return key;
}

function headers(extra?: Record<string, string>) {
  return { "X-Api-Key": apiKey(), "Content-Type": "application/json", ...extra };
}

/**
 * Upload a reference video to HeyGen and create an Instant Avatar.
 * Returns the avatar_id to store in the user's Profile.
 *
 * NOTE: HeyGen instant avatar creation requires a 3-15 second video of the
 * subject speaking clearly. Check https://docs.heygen.com for current limits.
 */
export async function createInstantAvatar(videoBuffer: Buffer, filename: string): Promise<string> {
  // Step 1: Upload video asset to HeyGen
  const formData = new FormData();
  formData.append("file", new Blob([videoBuffer.buffer as ArrayBuffer], { type: "video/mp4" }), filename);

  const uploadRes = await fetch(`${HEYGEN_UPLOAD}/v1/asset`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey() },
    body: formData,
  });
  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`HeyGen asset upload failed ${uploadRes.status}: ${text}`);
  }
  const uploadData = (await uploadRes.json()) as { data: { asset_id: string; url: string } };
  const assetId = uploadData.data.asset_id;

  // Step 2: Create instant avatar from uploaded video
  const createRes = await fetch(`${HEYGEN_API}/v2/instant_avatar`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ asset_id: assetId }),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`HeyGen avatar creation failed ${createRes.status}: ${text}`);
  }
  const createData = (await createRes.json()) as { data: { avatar_id: string } };
  return createData.data.avatar_id;
}

/**
 * Generate a lip-synced speaker video using a HeyGen avatar and a public audio URL.
 * Returns local path to the downloaded speaker MP4.
 */
export async function generateSpeakerVideo(
  avatarId: string,
  audioUrl: string,
  outputPath: string
): Promise<string> {
  // Step 1: Request video generation
  const genRes = await fetch(`${HEYGEN_API}/v2/video/generate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: avatarId,
            avatar_style: "normal",
          },
          voice: {
            type: "audio",
            audio_url: audioUrl,
          },
          background: {
            type: "color",
            value: "#000000",
          },
        },
      ],
      dimension: { width: 1080, height: 960 },
    }),
  });
  if (!genRes.ok) {
    const text = await genRes.text();
    throw new Error(`HeyGen video generation failed ${genRes.status}: ${text}`);
  }
  const genData = (await genRes.json()) as { data: { video_id: string } };
  const videoId = genData.data.video_id;
  console.log(`[heygen] video_id=${videoId} — polling for completion`);

  // Step 2: Poll until done (up to ~4 minutes, 5s interval)
  let videoUrl: string | null = null;
  for (let attempt = 0; attempt < 48; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `${HEYGEN_API}/v1/video_status.get?video_id=${videoId}`,
      { headers: { "X-Api-Key": apiKey() } }
    );
    if (!statusRes.ok) continue;
    const statusData = (await statusRes.json()) as {
      data: { status: string; video_url?: string; error?: string };
    };
    const { status, video_url, error } = statusData.data;
    console.log(`[heygen] attempt=${attempt + 1} status=${status}`);
    if (status === "completed" && video_url) {
      videoUrl = video_url;
      break;
    }
    if (status === "failed") {
      throw new Error(`HeyGen video generation failed: ${error ?? "unknown error"}`);
    }
  }

  if (!videoUrl) throw new Error("HeyGen video generation timed out after 4 minutes");

  // Step 3: Download the speaker video
  const dlRes = await fetch(videoUrl);
  if (!dlRes.ok) throw new Error(`Failed to download HeyGen video: ${dlRes.status}`);
  const buf = await dlRes.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buf));
  console.log(`[heygen] speaker video saved to ${path.basename(outputPath)}`);

  return outputPath;
}
