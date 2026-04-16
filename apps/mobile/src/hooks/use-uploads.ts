import { useMutation } from "@tanstack/react-query";

export function usePresignUpload() {
  return useMutation({ mutationFn: async (_body: { contentType: string; fileSize: number }) => ({ uploadUrl: "", headers: {}, audioPath: "mock-audio.webm", expiresIn: 3600 }) });
}

export async function uploadToPresignedUrl(_url: string, _fileUri: string, _contentType: string, _headers?: Record<string, string>): Promise<void> {
  // no-op in mock mode
}
