import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";

function makeS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function bucket() {
  return process.env.AWS_S3_BUCKET!;
}

export async function uploadFile(localPath: string, s3Key: string, contentType: string): Promise<string> {
  const s3 = makeS3Client();
  const fileBuffer = fs.readFileSync(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );
  return `https://${bucket()}.s3.amazonaws.com/${s3Key}`;
}

export async function getPresignedUrl(s3Key: string, expiresIn = 3600): Promise<string> {
  const s3 = makeS3Client();
  const command = new GetObjectCommand({ Bucket: bucket(), Key: s3Key });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function listBrainrotClips(): Promise<string[]> {
  const s3 = makeS3Client();
  const response = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket(), Prefix: "brainrot/" })
  );
  return (response.Contents ?? [])
    .map((obj) => obj.Key!)
    .filter((key) => key.endsWith(".mp4"));
}

export async function downloadFile(s3Key: string, destPath: string): Promise<void> {
  const s3 = makeS3Client();
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: s3Key }));
  const body = response.Body as NodeJS.ReadableStream;
  const writeStream = fs.createWriteStream(destPath);
  await new Promise<void>((resolve, reject) => {
    body.pipe(writeStream);
    body.on("error", reject);
    writeStream.on("finish", resolve);
  });
}
