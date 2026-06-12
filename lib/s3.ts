import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

export const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export async function uploadFile(localPath: string, s3Key: string, contentType: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );
  return `https://${BUCKET}.s3.amazonaws.com/${s3Key}`;
}

export async function getPresignedUrl(s3Key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function listBrainrotClips(): Promise<string[]> {
  const response = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "brainrot/" })
  );
  return (response.Contents ?? [])
    .map((obj) => obj.Key!)
    .filter((key) => key.endsWith(".mp4"));
}

export async function downloadFile(s3Key: string, destPath: string): Promise<void> {
  const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  const body = response.Body as NodeJS.ReadableStream;
  const writeStream = fs.createWriteStream(destPath);
  await new Promise<void>((resolve, reject) => {
    body.pipe(writeStream);
    body.on("error", reject);
    writeStream.on("finish", resolve);
  });
}
