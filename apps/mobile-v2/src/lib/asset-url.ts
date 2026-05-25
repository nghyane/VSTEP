const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.vstepgo.com";
const STORAGE_URL = process.env.EXPO_PUBLIC_STORAGE_URL ?? API_URL;

export function resolveAssetUrl(uri: string): string {
  if (/^https?:\/\//i.test(uri) || uri.startsWith("file://")) return uri;
  // Paths under /storage/ resolve to the storage base (Cloudflare R2).
  if (uri.startsWith("/storage/")) return `${STORAGE_URL}${uri}`;
  if (uri.startsWith("/")) return `${API_URL}${uri}`;
  return uri;
}
