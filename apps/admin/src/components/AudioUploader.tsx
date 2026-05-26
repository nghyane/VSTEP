import { CloseCircleOutlined, SoundOutlined, UploadOutlined } from "@ant-design/icons"
import { Alert, Button, Flex, Progress, Typography, Upload } from "antd"
import type { UploadFile } from "antd/es/upload/interface"
import { useState } from "react"
import { type ApiResponse, api, extractError } from "#/lib/api"

interface PresignResponse {
	upload_url: string
	audio_key: string
}

interface Props {
	value?: string | null
	onChange: (audioKey: string | null) => void
	context: "exam_listening" | "exam_speaking_prompt" | "speaking_drill" | "listening_drill"
	disabled?: boolean
	maxSizeMb?: number
}

const ACCEPTED_MIME = new Set([
	"audio/mpeg",
	"audio/mp3",
	"audio/mp4",
	"audio/x-m4a",
	"audio/wav",
	"audio/webm",
	"audio/ogg",
])

export function AudioUploader({ value, onChange, context, disabled, maxSizeMb = 10 }: Props) {
	const [uploading, setUploading] = useState(false)
	const [progress, setProgress] = useState(0)
	const [error, setError] = useState<string | null>(null)

	async function handleUpload(file: File): Promise<void> {
		setError(null)
		setUploading(true)
		setProgress(0)

		try {
			// 1. Get presigned URL from BE.
			const contentType = file.type || "audio/mpeg"
			const presign = await api
				.post("admin/audio/presign-upload", {
					json: { context, content_type: contentType, filename: file.name },
				})
				.json<ApiResponse<PresignResponse>>()

			// 2. Upload directly to R2 with progress tracking via XHR.
			await uploadToR2(presign.data.upload_url, file, contentType, setProgress)

			// 3. Hand audio_key back to caller.
			onChange(presign.data.audio_key)
		} catch (err) {
			const x = await extractError(err)
			setError(x.message)
		} finally {
			setUploading(false)
		}
	}

	function beforeUpload(file: File): boolean {
		setError(null)
		const mime = file.type.toLowerCase()
		if (!ACCEPTED_MIME.has(mime)) {
			setError(
				`Định dạng "${mime || "không xác định"}" chưa được hỗ trợ. Hãy dùng mp3, m4a, wav, webm hoặc ogg.`,
			)
			return false
		}
		if (file.size > maxSizeMb * 1024 * 1024) {
			setError(`Tệp quá lớn (tối đa ${maxSizeMb} MB).`)
			return false
		}
		void handleUpload(file)
		return false // Ngăn antd auto-upload — đã tự xử lý.
	}

	const fileList: UploadFile[] = []

	if (value) {
		return (
			<Flex vertical gap={8}>
				<Flex
					align="center"
					gap={8}
					style={{
						padding: "8px 12px",
						background: "var(--ant-color-fill-quaternary, #fafafa)",
						border: "1px solid var(--ant-color-border, #d9d9d9)",
						borderRadius: 6,
					}}
				>
					<SoundOutlined style={{ color: "var(--ant-color-primary, #1677ff)" }} />
					<Typography.Text style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }} ellipsis>
						{value}
					</Typography.Text>
					<Button
						type="text"
						size="small"
						danger
						icon={<CloseCircleOutlined />}
						onClick={() => onChange(null)}
						disabled={disabled}
					>
						Gỡ
					</Button>
				</Flex>
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Đã có file. Bấm Gỡ rồi tải lên file mới nếu cần thay.
				</Typography.Text>
			</Flex>
		)
	}

	return (
		<Flex vertical gap={8}>
			<Upload
				accept="audio/*"
				beforeUpload={beforeUpload}
				fileList={fileList}
				disabled={disabled || uploading}
				maxCount={1}
				showUploadList={false}
			>
				<Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
					{uploading ? "Đang tải lên..." : "Tải lên file audio"}
				</Button>
			</Upload>
			{uploading && <Progress percent={progress} size="small" />}
			{error && <Alert type="error" description={error} closable onClose={() => setError(null)} />}
			<Typography.Text type="secondary" style={{ fontSize: 12 }}>
				Hỗ trợ mp3, m4a, wav, webm, ogg. Tối đa {maxSizeMb} MB.
			</Typography.Text>
		</Flex>
	)
}

function uploadToR2(
	url: string,
	file: File,
	contentType: string,
	onProgress: (pct: number) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		xhr.open("PUT", url, true)
		xhr.setRequestHeader("Content-Type", contentType)
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
		}
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) resolve()
			else reject(new Error(`Upload thất bại (HTTP ${xhr.status})`))
		}
		xhr.onerror = () => reject(new Error("Upload thất bại do lỗi mạng."))
		xhr.send(file)
	})
}
