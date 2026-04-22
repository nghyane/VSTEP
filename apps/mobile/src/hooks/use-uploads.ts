import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePresignUpload() {
  return useMutation({
    mutationFn: (body: { contentType: string; fileSize: number }) =>
      api.post<{ uploadUrl: string; headers: Record<string, string>; audioPath: string; expiresIn: number }>(
        "/api/v1/audio/presign-upload",
        body,
      ),
  });
}

export async function uploadToPresignedUrl(
  url: string,
  fileUri: string,
  contentType: string,
  headers?: Record<string, string>,
): Promise<void> {
  const res = await fetch(fileUri);
  const blob = await res.blob();
  await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType, ...headers },
    body: blob,
  });
}
