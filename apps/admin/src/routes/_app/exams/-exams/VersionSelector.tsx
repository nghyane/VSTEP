import {
	BranchesOutlined,
	CheckCircleFilled,
	CheckCircleOutlined,
	ClockCircleOutlined,
	CloseCircleFilled,
	DeleteOutlined,
	PlusOutlined,
	RocketOutlined,
} from "@ant-design/icons"
import { useNavigate } from "@tanstack/react-router"
import { App, Button, Card, Col, Flex, Popconfirm, Row, Space, Tag, Typography, theme } from "antd"
import type { MouseEvent } from "react"
import { showError, showSuccess } from "#/components/Toaster"
import { useCreateVersion, useDeleteVersion, useSetVersionActive } from "#/features/admin-exams/mutations"
import type { ExamVersion } from "#/features/admin-exams/types"
import { extractError } from "#/lib/api"
import { formatDate } from "#/lib/utils"

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
	const { message, modal } = App.useApp()
	const { token } = theme.useToken()

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
			const data = (err as { data?: { checklist?: { label: string; pass: boolean }[] } }).data
			const checklist = data?.checklist

			if (checklist && checklist.length > 0) {
				modal.error({
					title: "Chưa thể kích hoạt phiên bản",
					content: (
						<Flex vertical gap={4} style={{ marginTop: 8 }}>
							<Typography.Text type="secondary">
								Đề thi chưa đủ nội dung theo cấu trúc VSTEP. Vui lòng bổ sung các mục còn thiếu:
							</Typography.Text>
							<div style={{ marginTop: 8 }}>
								{checklist.map((item, i) => (
									<Flex key={i} gap={8} align="start" style={{ marginBottom: 6 }}>
										{item.pass ? (
											<CheckCircleFilled style={{ color: token.colorSuccess, marginTop: 3, flexShrink: 0 }} />
										) : (
											<CloseCircleFilled style={{ color: token.colorError, marginTop: 3, flexShrink: 0 }} />
										)}
										<span style={{ color: item.pass ? token.colorTextSecondary : token.colorText }}>
											{item.label}
										</span>
									</Flex>
								))}
							</div>
						</Flex>
					),
					okText: "Đã hiểu",
					centered: true,
					width: 560,
				})
			} else if (e.errors?.exam_version) {
				modal.error({
					title: "Chưa thể kích hoạt phiên bản",
					content: (
						<ul style={{ margin: "8px 0", paddingLeft: 20 }}>
							{e.errors.exam_version.map((msg, i) => (
								<li key={i} style={{ marginBottom: 4 }}>{msg}</li>
							))}
						</ul>
					),
					okText: "Đã hiểu",
					centered: true,
				})
			} else {
				showError(e.message)
			}
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

	if (versions.length === 0) {
		return (
			<Card styles={{ body: { padding: 0 } }}>
				<Flex
					vertical
					align="center"
					justify="center"
					gap={16}
					style={{ padding: "64px 24px", textAlign: "center" }}
				>
					<Flex
						align="center"
						justify="center"
						style={{
							width: 64,
							height: 64,
							borderRadius: "50%",
							background: "var(--ant-color-primary-bg, #e6f4ff)",
						}}
					>
						<BranchesOutlined style={{ fontSize: 28, color: "var(--ant-color-primary, #1677ff)" }} />
					</Flex>
					<Flex vertical gap={4} align="center">
						<Typography.Title level={4} style={{ margin: 0 }}>
							Chưa có phiên bản đề thi
						</Typography.Title>
						<Typography.Text type="secondary" style={{ maxWidth: 420 }}>
							Mỗi đề thi cần ít nhất một phiên bản để chứa nội dung 4 kỹ năng (Listening, Reading, Writing,
							Speaking). Tạo phiên bản đầu tiên để bắt đầu.
						</Typography.Text>
					</Flex>
					<Button
						type="primary"
						size="large"
						icon={<PlusOutlined />}
						onClick={handleCreate}
						loading={create.isPending}
					>
						Tạo phiên bản đầu tiên
					</Button>
				</Flex>
			</Card>
		)
	}

	return (
		<Card
			title={
				<Space size={8}>
					<BranchesOutlined />
					<span>Phiên bản đề thi</span>
					<Tag color="blue">{versions.length}</Tag>
				</Space>
			}
			extra={
				<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} loading={create.isPending}>
					Tạo phiên bản mới
				</Button>
			}
			styles={{ body: { padding: 16 } }}
		>
			<Row gutter={[12, 12]} justify="center">
				{versions.map((v) => (
					<Col xs={24} sm={12} md={8} lg={6} key={v.id}>
						<VersionCard
							version={v}
							selected={v.id === selectedId}
							onSelect={() => navigate({ search: (prev) => ({ ...prev, version: v.id }) })}
							onActivate={() => handleActivate(v.id)}
							onDelete={() => handleDelete(v.id)}
							activating={activate.isPending}
							deleting={remove.isPending}
						/>
					</Col>
				))}
			</Row>
		</Card>
	)
}

interface VersionCardProps {
	version: ExamVersion
	selected: boolean
	onSelect: () => void
	onActivate: () => void
	onDelete: () => void
	activating: boolean
	deleting: boolean
}

function VersionCard({
	version,
	selected,
	onSelect,
	onActivate,
	onDelete,
	activating,
	deleting,
}: VersionCardProps) {
	const { token } = theme.useToken()
	const stop = (e: MouseEvent) => e.stopPropagation()

	return (
		<Card
			size="small"
			onClick={onSelect}
			styles={{
				body: { padding: 12 },
			}}
			style={{
				cursor: "pointer",
				borderColor: selected ? token.colorPrimary : token.colorBorderSecondary,
				borderWidth: selected ? 2 : 1,
				background: selected ? token.colorPrimaryBg : token.colorBgContainer,
				transition: "border-color 0.2s, background 0.2s",
			}}
		>
			<Flex justify="space-between" align="start" style={{ marginBottom: 8 }}>
				<Typography.Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
					v{version.version_number}
				</Typography.Title>
				{version.is_active ? (
					<Tag color="success" icon={<CheckCircleOutlined />}>
						Đang sử dụng
					</Tag>
				) : (
					<Tag>Bản nháp</Tag>
				)}
			</Flex>

			<Flex vertical gap={4} style={{ marginBottom: 12 }}>
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					<ClockCircleOutlined style={{ marginRight: 4 }} />
					Tạo: {formatDate(version.created_at)}
				</Typography.Text>
				{version.published_at && (
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						<RocketOutlined style={{ marginRight: 4 }} />
						Xuất bản: {formatDate(version.published_at)}
					</Typography.Text>
				)}
			</Flex>

			{!version.is_active && (
				<Flex gap={4} onClick={stop}>
					<Button size="small" type="primary" ghost block loading={activating} onClick={onActivate}>
						Kích hoạt
					</Button>
					<Popconfirm
						title="Xoá phiên bản này?"
						description="Hành động không thể hoàn tác."
						onConfirm={onDelete}
						okText="Xoá"
						cancelText="Huỷ"
						okButtonProps={{ danger: true, loading: deleting }}
					>
						<Button size="small" danger icon={<DeleteOutlined />} />
					</Popconfirm>
				</Flex>
			)}
		</Card>
	)
}
