import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { UploadAudioResponse } from "@/types/api"

function useUploadAudio() {
	return useMutation({
		mutationFn: (file: File) => {
			const formData = new FormData()
			formData.append("audio", file)
			return api.upload<UploadAudioResponse>("/api/uploads/audio", formData)
		},
	})
}

export { useUploadAudio }
