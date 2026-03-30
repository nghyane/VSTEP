import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PresignResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Presigned upload flow for speaking audio
// 1. POST /api/uploads/presign → get { uploadUrl, headers, audioPath, expiresIn }
// 2. PUT file directly to presigned URL (R2/S3) using XMLHttpRequest (RN compatible)
// 3. Use the returned `audioPath` in the answer body
// ---------------------------------------------------------------------------

export function usePresignUpload() {
  return useMutation({
    mutationFn: (body: { contentType: string; fileSize: number }) =>
      api.post<PresignResponse>("/api/uploads/presign", body),
  });
}

export async function uploadToPresignedUrl(
  presignedUrl: string,
  fileUri: string,
  contentType: string,
  headers?: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));

    // React Native: fetch file as blob via XHR
    const fileXhr = new XMLHttpRequest();
    fileXhr.open("GET", fileUri);
    fileXhr.responseType = "blob";
    fileXhr.onload = () => {
      if (fileXhr.status === 200 || fileXhr.status === 0) {
        xhr.send(fileXhr.response);
      } else {
        reject(new Error(`Failed to read audio file: ${fileXhr.status}`));
      }
    };
    fileXhr.onerror = () => reject(new Error("Failed to read audio file"));
    fileXhr.send();
  });
}

// Avatar upload lives in use-user.ts (useUploadAvatar)
