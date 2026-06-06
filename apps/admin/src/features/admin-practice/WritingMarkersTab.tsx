import { PlusOutlined, WarningOutlined } from "@ant-design/icons"
import { Alert, Empty, Flex, Typography } from "antd"
import { useEffect, useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { MarkerEditor } from "#/features/admin-practice/MarkerEditor"
import { MarkerPreview } from "#/features/admin-practice/MarkerPreview"
import type { AdminWritingMarker, WritingMarkerFormInput } from "#/features/admin-practice/types"
import {
	useCreateWritingMarker,
	useDeleteWritingMarker,
	useUpdateWritingMarker,
} from "#/features/admin-practice/writing"
import { extractError } from "#/lib/api"

interface Props {
	promptId: string
	sampleAnswer: string | null
	markers: AdminWritingMarker[]
}

const MARKER_WARN_THRESHOLD = 8

type EditorMode =
	| { type: "idle" }
	| { type: "create"; selection: { text: string; occurrence: number } }
	| { type: "edit"; marker: AdminWritingMarker }

export function WritingMarkersTab({ promptId, sampleAnswer, markers }: Props) {
	const create = useCreateWritingMarker(promptId)
	const update = useUpdateWritingMarker(promptId)
	const remove = useDeleteWritingMarker(promptId)

	const [mode, setMode] = useState<EditorMode>({ type: "idle" })
	const [deleteConfirm, setDeleteConfirm] = useState<AdminWritingMarker | null>(null)
	const [localMarkers, setLocalMarkers] = useState<AdminWritingMarker[]>(markers)

	useEffect(() => {
		setLocalMarkers(markers)
	}, [markers])

	const activeMarkerId = mode.type === "edit" ? mode.marker.id : null

	function handleTextSelect(selection: { text: string; occurrence: number }) {
		setMode({ type: "create", selection })
	}

	function handleMarkerClick(marker: AdminWritingMarker) {
		setMode({ type: "edit", marker })
	}

	async function handleSave(input: WritingMarkerFormInput) {
		try {
			if (mode.type === "create") {
				await create.mutateAsync(input)
				showSuccess("Đã tạo marker.")
			} else if (mode.type === "edit") {
				await update.mutateAsync({ id: mode.marker.id, input })
				showSuccess("Đã cập nhật marker.")
			}
			setMode({ type: "idle" })
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function handleReorder(updated: AdminWritingMarker[]) {
		const snapshot = localMarkers
		setLocalMarkers((prev) => {
			const map = new Map(updated.map((m) => [m.id, m]))
			return prev.map((m) => map.get(m.id) ?? m)
		})
		try {
			await Promise.all(
				updated.map((m) =>
					update.mutateAsync({ id: m.id, input: { display_order: m.display_order, side: m.side } }),
				),
			)
			showSuccess("Đã cập nhật thứ tự marker.")
		} catch (err) {
			setLocalMarkers(snapshot)
			showError((await extractError(err)).message)
		}
	}

	async function handleDelete() {
		if (!deleteConfirm) return
		try {
			await remove.mutateAsync(deleteConfirm.id)
			showSuccess("Đã xoá marker.")
			setDeleteConfirm(null)
			setMode({ type: "idle" })
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	// No sample answer
	if (!sampleAnswer) {
		return (
			<div
				style={{
					borderRadius: 12,
					border: "2px dashed #d1d5db",
					backgroundColor: "#f9fafb",
					padding: 48,
					textAlign: "center",
				}}
			>
				<Empty
					description={
						<span style={{ color: "#6b7280" }}>
							Chưa có bài mẫu. Vui lòng thêm <strong>sample_answer</strong> trong tab Thông tin trước.
						</span>
					}
				/>
			</div>
		)
	}

	return (
		<Flex vertical gap={16}>
			{/* Warning: too many markers */}
			{localMarkers.length >= MARKER_WARN_THRESHOLD && (
				<Alert
					type="warning"
					icon={<WarningOutlined />}
					showIcon
					message={`${localMarkers.length} markers — Nhiều marker có thể làm preview khó đọc. Cân nhắc gộp hoặc bỏ bớt.`}
				/>
			)}

			{/* Toolbar */}
			<Flex align="center" gap={12}>
				<Button
					icon={<PlusOutlined />}
					size="sm"
					variant="ghost"
					onClick={() => setMode({ type: "create", selection: { text: "", occurrence: 1 } })}
				>
					Tạo marker
				</Button>
				<Typography.Text type="secondary" style={{ fontSize: 13 }}>
					Bôi đen text để tạo marker mới • Click marker để chỉnh sửa
				</Typography.Text>
			</Flex>

			{/* Preview with side markers and bezier lines */}
			<MarkerPreview
				sampleAnswer={sampleAnswer}
				markers={localMarkers}
				activeMarkerId={activeMarkerId}
				onMarkerClick={handleMarkerClick}
				onTextSelect={handleTextSelect}
				onReorder={handleReorder}
			/>

			{/* Editor Modal */}
			<Modal
				open={mode.type !== "idle"}
				onClose={() => setMode({ type: "idle" })}
				title={mode.type === "edit" ? "Sửa marker" : "Tạo marker mới"}
				size="md"
			>
				<MarkerEditor
					marker={mode.type === "edit" ? mode.marker : null}
					initialSelection={mode.type === "create" ? mode.selection : null}
					onSave={handleSave}
					onDelete={
						mode.type === "edit"
							? () => {
									setDeleteConfirm(mode.marker)
									return Promise.resolve()
								}
							: undefined
					}
					onCancel={() => setMode({ type: "idle" })}
					saving={create.isPending || update.isPending}
				/>
			</Modal>

			{/* Delete confirmation */}
			<ConfirmDialog
				open={!!deleteConfirm}
				onClose={() => setDeleteConfirm(null)}
				onConfirm={handleDelete}
				title="Xoá marker"
				description={deleteConfirm ? `Xoá marker "${deleteConfirm.label}"?` : undefined}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
