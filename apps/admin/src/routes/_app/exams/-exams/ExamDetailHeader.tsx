import { ArrowLeftOutlined } from "@ant-design/icons"
import { Link } from "@tanstack/react-router"
import { Switch as AntdSwitch, Flex, Space, Tag, Tooltip, Typography } from "antd"
import { showError, showSuccess } from "#/components/Toaster"
import { useSetExamPublished } from "#/features/admin-exams/mutations"
import type { AdminExam } from "#/features/admin-exams/types"
import { extractError } from "#/lib/api"

interface Props {
	exam: AdminExam
}

export function ExamDetailHeader({ exam }: Props) {
	const setPub = useSetExamPublished()
	const hasVersion = exam.active_version !== null

	async function togglePublish(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: exam.id, published: !exam.is_published })
			showSuccess(exam.is_published ? "Đã ẩn đề thi." : "Đã xuất bản.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	const publishSwitch = (
		<AntdSwitch
			checked={exam.is_published}
			onChange={togglePublish}
			checkedChildren="Xuất bản"
			unCheckedChildren="Nháp"
			disabled={!hasVersion && !exam.is_published}
			loading={setPub.isPending}
		/>
	)

	return (
		<Flex vertical gap={8}>
			<Link to="/exams" style={{ width: "fit-content" }}>
				<Space>
					<ArrowLeftOutlined />
					<span>Danh sách đề thi</span>
				</Space>
			</Link>
			<Flex justify="space-between" align="center" wrap="wrap" gap={12}>
				<Flex vertical>
					<Typography.Title level={3} style={{ margin: 0 }}>
						{exam.title}
					</Typography.Title>
					<Space style={{ marginTop: 4 }}>
						{exam.source_school && <Tag>{exam.source_school}</Tag>}
						<Typography.Text type="secondary">{exam.total_duration_minutes} phút</Typography.Text>
					</Space>
				</Flex>
				{!hasVersion && !exam.is_published ? (
					<Tooltip title="Cần có phiên bản hoạt động để xuất bản">{publishSwitch}</Tooltip>
				) : (
					publishSwitch
				)}
			</Flex>
		</Flex>
	)
}
