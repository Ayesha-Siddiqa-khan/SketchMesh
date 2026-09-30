import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY || "minioadmin";
const secretAccessKey = process.env.S3_SECRET_KEY || "minioadmin";
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "sketchmesh-assets";

export const s3Client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true, // Crucial for MinIO and custom S3 endpoints
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadThumbnail(
  buffer: Buffer,
  filename: string,
  contentType: string = "image/png"
): Promise<string> {
  const key = `thumbnails/${Date.now()}-${filename}`;
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      })
    );
    const publicUrlBase =
      process.env.NEXT_PUBLIC_STORAGE_BASE_URL ||
      `${endpoint}/${S3_BUCKET_NAME}`;
    return `${publicUrlBase}/${key}`;
  } catch (error) {
    console.error("S3 upload failed, falling back to data URL or mock:", error);
    // If S3 is not currently reachable during local run without docker compose,
    // generate an inline Data URL fallback so the post creation never fails
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }
}
