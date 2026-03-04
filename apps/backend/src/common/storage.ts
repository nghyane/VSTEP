import { env } from "@common/env";
import { S3Client } from "bun";

export const storage = new S3Client({
  endpoint: env.S3_ENDPOINT,
  bucket: env.S3_BUCKET,
  accessKeyId: env.S3_ACCESS_KEY,
  secretAccessKey: env.S3_SECRET_KEY,
  region: "auto",
});
