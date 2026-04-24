const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.vstepgo.com";

export function resolveAssetUrl(uri: string): string {
  if (/^https?:\/\//i.test(uri) || uri.startsWith("file://")) return uri;
  if (uri.startsWith("/")) return `${API_URL}${uri}`;
  return uri;
}
