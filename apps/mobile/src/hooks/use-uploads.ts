import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PresignResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Presigned upload flow for speaking audio
// 1. POST /api/uploads/presign → get { url, key, expiresAt }
// 2. PUT file directly to presigned URL (R2/S3)
// 3. Use the returned `key` in the answer body
// ---------------------------------------------------------------------------

export function usePresignUpload() {
  return useMutation({
    mutationFn: (body: { filename: string; contentType: string }) =>
      api.post<PresignResponse>("/api/uploads/presign", body),
  });
}

export async function uploadToPresignedUrl(
  presignedUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.status}`);
  }
}

// Avatar upload lives in use-user.ts (useUploadAvatar)
