import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

interface PresignResponse {
	uploadUrl: string
	headers: Record<string, string>
	audioPath: string
	expiresIn: number
}

/**
 * Upload speaking audio to R2 via presigned URL.
 *
 * Flow:
 * 1. POST /api/uploads/presign → get upload_url + audio_path
 * 2. PUT upload_url with raw audio bytes → upload to R2
 * 3. Return audio_path for saving as answer
 */
function useUploadSpeakingAudio() {
	return useMutation({
		mutationFn: async (blobUrl: string): Promise<string> => {
			// 1. Fetch the blob from browser memory
			const blobRes = await fetch(blobUrl)
			const blob = await blobRes.blob()

			// Determine content type — prefer ogg, fallback wav
			const contentType = blob.type === "audio/wav" ? "audio/wav" : "audio/ogg"

			// 2. Get presigned upload URL from backend
			const presign = await api.post<PresignResponse>("/api/uploads/presign", {
				contentType,
				fileSize: blob.size,
			})

			// 3. Upload directly to R2 via presigned URL
			const uploadRes = await fetch(presign.uploadUrl, {
				method: "PUT",
				headers: {
					"Content-Type": contentType,
					...presign.headers,
				},
				body: blob,
			})

			if (!uploadRes.ok) {
				throw new Error(`Upload failed: ${uploadRes.status}`)
			}

			// 4. Return the storage path for saving as answer
			return presign.audioPath
		},
	})
}

export { useUploadSpeakingAudio }
