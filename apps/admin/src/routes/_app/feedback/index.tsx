import { StarFilled } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Empty, Flex, Table, Tag, Typography } from "antd"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import {
	type ExerciseFeedbackContentType,
	type ExerciseFeedbackItem,
	feedbackListQuery,
} from "#/features/admin-feedback/feedback"
import { formatDateTime } from "#/lib/utils"

interface Search {
	page?: number
	content_type?: ExerciseFeedbackContentType | "all"
	rating?: number
}

const contentTypeLabels: Record<ExerciseFeedbackContentType, string> = {
	practice_listening_exercise: "Nghe",
	practice_reading_exercise: "Đọc",
}

function parsePage(value: unknown): number | undefined {
	const page = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
	return Number.isInteger(page) && page > 0 ? page : undefined
}

function parseRating(value: unknown): number | undefined {
	const rating = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
	return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : undefined
}

function parseContentType(value: unknown): Search["content_type"] {
	return value === "practice_listening_exercise" || value === "practice_reading_exercise" || value === "all"
		? value
		: undefined
}

export const Route = createFileRoute("/_app/feedback/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: parsePage(s.page),
		content_type: parseContentType(s.content_type),
		rating: parseRating(s.rating),
	}),
	component: FeedbackListPage,
})

function FeedbackListPage() {
	const navigate = useNavigate({ from: "/feedback/" })
	const search = Route.useSearch()
	const { page = 1, content_type = "all", rating } = search
	const { data, isLoading } = useQuery(feedbackListQuery({ page, content_type, rating, per_page: 20 }))

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	function handleContentTypeChange(value: string): void {
		setSearch({ content_type: parseContentType(value) })
	}

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Phản hồi bài luyện"
				subtitle="Theo dõi đánh giá học viên gửi từ màn kết quả luyện nghe và luyện đọc."
			/>

			<Flex wrap align="center" gap={8}>
				<div style={{ width: 180 }}>
					<Select value={content_type} onChange={(e) => handleContentTypeChange(e.target.value)}>
						<option value="all">Tất cả kỹ năng</option>
						<option value="practice_listening_exercise">Nghe</option>
						<option value="practice_reading_exercise">Đọc</option>
					</Select>
				</div>
				<div style={{ width: 140 }}>
					<Select
						value={rating ?? ""}
						onChange={(e) => setSearch({ rating: e.target.value ? Number(e.target.value) : undefined })}
					>
						<option value="">Mọi số sao</option>
						<option value={5}>5 sao</option>
						<option value={4}>4 sao</option>
						<option value={3}>3 sao</option>
						<option value={2}>2 sao</option>
						<option value={1}>1 sao</option>
					</Select>
				</div>
			</Flex>

			{!isLoading && data?.data.length === 0 ? (
				<Empty description="Chưa có phản hồi bài luyện." />
			) : (
				<Table
					rowKey="id"
					loading={isLoading}
					dataSource={data?.data ?? []}
					pagination={
						data && data.meta.last_page > 1
							? {
									current: data.meta.current_page,
									total: data.meta.total,
									pageSize: data.meta.per_page,
									onChange: (p) => setSearch({ page: p }),
									showSizeChanger: false,
								}
							: false
					}
					columns={[
						{
							title: "Bài luyện",
							render: (_, item: ExerciseFeedbackItem) => (
								<Flex vertical gap={2}>
									<Typography.Text strong>{item.content_title ?? "Bài luyện đã xoá"}</Typography.Text>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{item.content_slug ?? item.content_id}
									</Typography.Text>
								</Flex>
							),
						},
						{
							title: "Kỹ năng",
							dataIndex: "content_type",
							render: (value: ExerciseFeedbackContentType) => <Tag>{contentTypeLabels[value]}</Tag>,
						},
						{
							title: "Đánh giá",
							dataIndex: "rating",
							render: (value: number) => (
								<Typography.Text strong style={{ color: "#faad14" }}>
									{value} <StarFilled />
								</Typography.Text>
							),
						},
						{
							title: "Góp ý",
							dataIndex: "comment",
							render: (value: string | null) =>
								value || <Typography.Text type="secondary">Không có</Typography.Text>,
						},
						{
							title: "Học viên",
							render: (_, item: ExerciseFeedbackItem) => item.profile?.nickname ?? "—",
						},
						{
							title: "Ngày gửi",
							dataIndex: "created_at",
							render: (value: string) => formatDateTime(value),
						},
					]}
				/>
			)}
		</Flex>
	)
}
