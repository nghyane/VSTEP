import { AuthErrors } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { uploadAudio } from "./service";

export const uploads = new Elysia({
  name: "module:uploads",
  prefix: "/uploads",
  detail: { tags: ["Uploads"] },
})
  .use(authPlugin)

  .post("/audio", ({ body }) => uploadAudio(body.audio), {
    auth: true,
    body: t.Object({
      audio: t.File({
        type: [
          "audio/mpeg",
          "audio/mp4",
          "audio/x-m4a",
          "audio/wav",
          "audio/webm",
          "audio/ogg",
        ],
        maxSize: "10m",
      }),
    }),
    response: {
      200: t.Object({ audioKey: t.String() }),
      ...AuthErrors,
    },
    detail: {
      summary: "Upload audio",
      description:
        "Upload an audio file for speaking submissions. Max 10MB. Supports MP3, M4A, WAV, WebM, OGG.",
      security: [{ bearerAuth: [] }],
    },
  });
