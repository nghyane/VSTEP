import * as FileSystem from "expo-file-system/legacy";

import { audioUploadMetaFromUri, presignUpload, type AudioUploadMeta } from "@/hooks/use-practice";

export function audioMetaFromUri(uri: string): AudioUploadMeta {
  return audioUploadMetaFromUri(uri);
}

export async function uploadLocalAudioToPresignedUrl(
  audioUri: string,
  uploadUrl: string,
  contentType: string,
) {
  const result = await FileSystem.uploadAsync(uploadUrl, audioUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed with status ${result.status}`);
  }

  return result;
}

export async function uploadSpeakingAudio(
  audioUri: string,
  context: "speaking" | "exam_speaking" = "speaking",
) {
  const meta = audioMetaFromUri(audioUri);
  const presign = await presignUpload(context, meta);
  await uploadLocalAudioToPresignedUrl(audioUri, presign.uploadUrl, meta.contentType);
  return { audioKey: presign.audioKey, meta };
}
