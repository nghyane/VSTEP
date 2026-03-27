import { storage } from "@common/storage";

export async function uploadAudio(file: File) {
  const ext = file.name?.split(".").pop() ?? "webm";
  const key = `audio/${crypto.randomUUID()}.${ext}`;
  await storage.write(key, file);
  return { audioKey: key };
}
