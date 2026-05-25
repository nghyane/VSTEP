import { InboxOutlined } from "@ant-design/icons"
import { Alert, Flex, Typography, Upload } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { useImportExam } from "#/features/admin-exams/mutations"
import { extractError, formatApiErrorBanner } from "#/lib/api"

interface Props {
	onSuccess: () => void
	onCancel: () => void
}

export function ImportExamForm({ onSuccess, onCancel }: Props) {
	const [payload, setPayload] = useState<unknown>(null)
	const [fileName, setFileName] = useState<string | null>(null)
	const [parseError, setParseError] = useState<string | null>(null)
	const [submitError, setSubmitError] = useState<string | null>(null)

	const importMutation = useImportExam()

	function handleFile(file: File): false {
		setParseError(null)
		setSubmitError(null)
		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const json = JSON.parse(e.target?.result as string)
				setPayload(json)
				setFileName(file.name)
			} catch {
				setParseError("File không phải JSON hợp lệ.")
				setPayload(null)
				setFileName(null)
			}
		}
		reader.readAsText(file)
		return false
	}

	async function handleSubmit(): Promise<void> {
		if (!payload) return
		setSubmitError(null)
		try {
			await importMutation.mutateAsync(payload)
			onSuccess()
		} catch (err) {
			const x = await extractError(err)
			setSubmitError(formatApiErrorBanner(x))
		}
	}

	return (
		<Flex vertical gap={16}>
			<Typography.Text type="secondary">
				Upload file JSON theo format import (gồm exam metadata + version content đầy đủ 4 skills).
			</Typography.Text>

			<Upload.Dragger accept=".json" showUploadList={false} beforeUpload={handleFile} multiple={false}>
				<p className="ant-upload-drag-icon">
					<InboxOutlined />
				</p>
				<p className="ant-upload-text">{fileName ?? "Kéo file JSON vào đây hoặc click để chọn"}</p>
			</Upload.Dragger>

			{parseError && <Alert type="error" message={parseError} showIcon />}
			{submitError && <Alert type="error" message={submitError} showIcon />}
			{payload !== null && <Alert type="success" message={`Đã parse thành công: ${fileName}`} showIcon />}

			<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
				<Button variant="ghost" onClick={onCancel}>
					Huỷ
				</Button>
				<Button onClick={handleSubmit} loading={importMutation.isPending} disabled={!payload}>
					Import
				</Button>
			</Flex>
		</Flex>
	)
}
