import { CheckCircleOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { useNavigate } from "@tanstack/react-router"
import { App, Button, Flex, Popconfirm, Space, Tag, Typography } from "antd"
import { showError, showSuccess } from "#/components/Toaster"
import { useCreateVersion, useDeleteVersion, useSetVersionActive } from "#/features/admin-exams/mutations"
import type { ExamVersion } from "#/features/admin-exams/types"
import { extractError } from "#/lib/api"

interface Props {
	examId: string
	versions: ExamVersion[]
	selectedId: string | undefined
}

export function VersionSelector({ examId, versions, selectedId }: Props) {
	const navigate = useNavigate({ from: "/exams/$examId" })
	const create = useCreateVersion(examId)
	const activate = useSetVersionActive(examId)
	const remove = useDeleteVersion(examId)
	const { message } = App.useApp()

	async function handleCreate(): Promise<void> {
		try {
			const res = await create.mutateAsync()
			showSuccess(`Đã tạo phiên bản ${res.data.version_number}.`)
			navigate({ search: { version: res.data.id } })
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	async function handleActivate(versionId: string): Promise<void> {
		try {
			await activate.mutateAsync(versionId)
			message.success("Đã kích hoạt phiên bản.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	async function handleDelete(versionId: string): Promise<void> {
		try {
			await remove.mutateAsync(versionId)
			showSuccess("Đã xoá phiên bản.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	return (
		<Flex vertical gap={8}>
			<Flex justify="space-between" align="center">
				<Typography.Text strong>Phiên bản</Typography.Text>
				<Button size="small" icon={<PlusOutlined />} onClick={handleCreate} loading={create.isPending}>
					Tạo phiên bản mới
				</Button>
			</Flex>
			<Flex gap={8} wrap>
				{versions.map((v) => (
					<VersionTag
						key={v.id}
						version={v}
						selected={v.id === selectedId}
						onSelect={() => navigate({ search: (prev) => ({ ...prev, version: v.id }) })}
						onActivate={() => handleActivate(v.id)}
						onDelete={() => handleDelete(v.id)}
					/>
				))}
				{versions.length === 0 && (
					<Typography.Text type="secondary">Chưa có phiên bản. Tạo mới hoặc import đề.</Typography.Text>
				)}
			</Flex>
		</Flex>
	)
}

interface VersionTagProps {
	version: ExamVersion
	selected: boolean
	onSelect: () => void
	onActivate: () => void
	onDelete: () => void
}

function VersionTag({ version, selected, onSelect, onActivate, onDelete }: VersionTagProps) {
	return (
		<Space size={4}>
			<Tag
				color={selected ? "blue" : version.is_active ? "green" : "default"}
				style={{ cursor: "pointer" }}
				onClick={onSelect}
			>
				v{version.version_number}
				{version.is_active && <CheckCircleOutlined style={{ marginLeft: 4 }} />}
			</Tag>
			{selected && !version.is_active && (
				<Button size="small" type="link" onClick={onActivate}>
					Kích hoạt
				</Button>
			)}
			{selected && !version.is_active && (
				<Popconfirm title="Xoá phiên bản này?" onConfirm={onDelete} okText="Xoá" cancelText="Huỷ">
					<Button size="small" type="link" danger icon={<DeleteOutlined />} />
				</Popconfirm>
			)}
		</Space>
	)
}
