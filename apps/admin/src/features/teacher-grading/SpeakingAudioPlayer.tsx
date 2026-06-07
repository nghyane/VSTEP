import { Space, Tag, Typography } from "antd"

export interface SpeakingAudioSource {
	audioUrl: string | null
	audioKey: string | null
	durationSeconds: number | null
}

export function speakingAudioSource(payload: Record<string, unknown>): SpeakingAudioSource {
	const metadata = recordValue(payload.metadata)

	return {
		audioUrl: stringValue(payload.audio_url),
		audioKey: stringValue(payload.audio_key),
		durationSeconds: numberValue(metadata?.duration_seconds),
	}
}

export function hasSpeakingAudio(source: SpeakingAudioSource): boolean {
	return source.audioUrl !== null || source.audioKey !== null
}

export function SpeakingAudioPlayer({ source }: { source: SpeakingAudioSource }) {
	if (!hasSpeakingAudio(source)) {
		return <Typography.Text type="secondary">Không có file audio trong bài nộp.</Typography.Text>
	}

	return (
		<section>
			<Space orientation="vertical" size={8} style={{ width: "100%" }}>
				<Space wrap>
					<Typography.Text strong>Audio bài nói</Typography.Text>
					{source.durationSeconds !== null && <Tag>{formatDuration(source.durationSeconds)}</Tag>}
				</Space>
				{source.audioUrl ? (
					<audio controls preload="metadata" src={source.audioUrl} style={{ width: "100%" }}>
						<track kind="captions" />
					</audio>
				) : (
					<Typography.Text type="secondary">Có audio key nhưng chưa có URL phát audio.</Typography.Text>
				)}
			</Space>
		</section>
	)
}

function stringValue(value: unknown): string | null {
	return typeof value === "string" && value.trim() !== "" ? value : null
}

function numberValue(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null
}

function recordValue(value: unknown): Record<string, unknown> | null {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null
}

function formatDuration(seconds: number): string {
	const rounded = Math.max(0, Math.round(seconds))
	const minutes = Math.floor(rounded / 60)
	const rest = rounded % 60

	return minutes > 0 ? `${minutes}:${String(rest).padStart(2, "0")}` : `${rest}s`
}
