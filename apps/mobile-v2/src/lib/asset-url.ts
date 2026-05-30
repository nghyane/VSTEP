import { api } from "@/lib/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.vstepgo.com";

export function resolveAssetUrl(uri: string): string {
  if (/^https?:\/\//i.test(uri) || uri.startsWith("file://")) return uri;
  // /storage is a Laravel public-disk route. R2/private audio keys are raw keys
  // such as audio/listening/file.mp3 and go through presign-download below.
  if (uri.startsWith("/storage/")) return `${API_URL}${uri}`;
  if (uri.startsWith("/")) return `${API_URL}${uri}`;
  return uri;
}

export async function resolvePlayableAudioUrl(uri: string): Promise<string> {
  const resolved = resolveAssetUrl(uri);
  if (resolved !== uri || /^https?:\/\//i.test(uri) || uri.startsWith("file://")) {
    return resolved;
  }

  const { downloadUrl } = await api.post<{ downloadUrl: string }>("/api/v1/audio/presign-download", {
    audioKey: uri,
  });
  return downloadUrl;
}
