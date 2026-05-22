// Avatar API — preset selection (PATCH JSON) + photo upload (POST multipart).
//
// Upload path bypasses the shared `api` client because it uses JSON content type
// and snake/camel transform; multipart needs raw FormData and no JSON header.
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import type { AvatarKey } from "@/types/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.vstepgo.com";

export interface AvatarUpdateResult {
  avatarKey: AvatarKey | null;
  avatarUrl: string | null;
}

export async function updateAvatarPreset(avatarKey: AvatarKey): Promise<AvatarUpdateResult> {
  return api.patch<AvatarUpdateResult>("/api/v1/me/avatar", { avatarKey });
}

export async function uploadAvatarPhoto(uri: string, mimeType: string): Promise<AvatarUpdateResult> {
  const token = await getAccessToken();
  const form = new FormData();
  const filename = uri.split("/").pop() ?? "avatar.jpg";
  // React Native FormData expects {uri, name, type} for file parts.
  form.append("avatar", {
    uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  const res = await fetch(`${API_URL}/api/v1/me/avatar`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed (HTTP ${res.status})`);
  }

  const json = (await res.json()) as {
    data: { avatar_key: AvatarKey | null; avatar_url: string | null };
  };
  return {
    avatarKey: json.data.avatar_key,
    avatarUrl: json.data.avatar_url,
  };
}
