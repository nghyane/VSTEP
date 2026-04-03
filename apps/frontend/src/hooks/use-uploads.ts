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
 * Always converts to WAV PCM 16kHz mono before upload — Azure Speech REST API
 * only supports WAV and OGG, and Chrome MediaRecorder only produces WebM.
 */
function useUploadSpeakingAudio() {
	return useMutation({
		mutationFn: async (blobUrl: string): Promise<string> => {
			const blobRes = await fetch(blobUrl)
			const blob = await blobRes.blob()

			// Convert any format to WAV PCM 16kHz mono for Azure compatibility
			const wavBlob = await convertToWav(blob)

			const presign = await api.post<PresignResponse>("/api/uploads/presign", {
				contentType: "audio/wav",
				fileSize: wavBlob.size,
			})

			const uploadRes = await fetch(presign.uploadUrl, {
				method: "PUT",
				headers: {
					"Content-Type": "audio/wav",
					...presign.headers,
				},
				body: wavBlob,
			})

			if (!uploadRes.ok) {
				throw new Error(`Upload failed: ${uploadRes.status}`)
			}

			return presign.audioPath
		},
	})
}

const TARGET_SAMPLE_RATE = 16000

/**
 * Convert any browser audio blob to WAV PCM 16kHz mono using Web Audio API.
 * No external dependencies — uses built-in AudioContext for decoding and resampling.
 */
async function convertToWav(blob: Blob): Promise<Blob> {
	const arrayBuffer = await blob.arrayBuffer()
	const audioCtx = new OfflineAudioContext(1, 1, TARGET_SAMPLE_RATE)
	const decoded = await audioCtx.decodeAudioData(arrayBuffer)

	// Resample to 16kHz mono
	const offlineCtx = new OfflineAudioContext(
		1,
		Math.ceil(decoded.duration * TARGET_SAMPLE_RATE),
		TARGET_SAMPLE_RATE,
	)
	const source = offlineCtx.createBufferSource()
	source.buffer = decoded
	source.connect(offlineCtx.destination)
	source.start(0)
	const resampled = await offlineCtx.startRendering()

	const pcmData = resampled.getChannelData(0)
	const wavBuffer = encodeWav(pcmData, TARGET_SAMPLE_RATE)
	return new Blob([wavBuffer], { type: "audio/wav" })
}

/** Encode Float32 PCM samples into a WAV file buffer. */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
	const numChannels = 1
	const bitsPerSample = 16
	const bytesPerSample = bitsPerSample / 8
	const dataLength = samples.length * bytesPerSample
	const buffer = new ArrayBuffer(44 + dataLength)
	const view = new DataView(buffer)

	// RIFF header
	writeString(view, 0, "RIFF")
	view.setUint32(4, 36 + dataLength, true)
	writeString(view, 8, "WAVE")

	// fmt chunk
	writeString(view, 12, "fmt ")
	view.setUint32(16, 16, true) // chunk size
	view.setUint16(20, 1, true) // PCM format
	view.setUint16(22, numChannels, true)
	view.setUint32(24, sampleRate, true)
	view.setUint32(28, sampleRate * numChannels * bytesPerSample, true)
	view.setUint16(32, numChannels * bytesPerSample, true)
	view.setUint16(34, bitsPerSample, true)

	// data chunk
	writeString(view, 36, "data")
	view.setUint32(40, dataLength, true)

	// Convert float32 [-1, 1] to int16
	let offset = 44
	for (let i = 0; i < samples.length; i++) {
		const clamped = Math.max(-1, Math.min(1, samples[i]))
		view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
		offset += 2
	}

	return buffer
}

function writeString(view: DataView, offset: number, str: string) {
	for (let i = 0; i < str.length; i++) {
		view.setUint8(offset + i, str.charCodeAt(i))
	}
}

export { useUploadSpeakingAudio }
