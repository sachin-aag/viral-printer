import { task } from "@renderinc/sdk/workflows";
import { uploadFile, getPresignedUrl } from "@/lib/s3";
import path from "path";

export const uploadToS3Task = task(
  { name: "uploadToS3", timeoutSeconds: 120 },
  async function uploadToS3(videoPath: string, runId: string): Promise<string> {
    console.log(`[uploadToS3] path=${videoPath}`);
    const s3Key = `videos/${runId}/${path.basename(videoPath)}`;
    const publicUrl = await uploadFile(videoPath, s3Key, "video/mp4");
    // Return a presigned URL valid for 7 days for TikTok upload + preview
    const presignedUrl = await getPresignedUrl(s3Key, 7 * 24 * 3600);
    return presignedUrl;
  }
);
