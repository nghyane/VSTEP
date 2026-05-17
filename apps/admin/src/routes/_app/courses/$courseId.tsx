import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Skeleton as AntSkeleton, Flex, Space, Tag } from "antd"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
import { Switch } from "#/components/Switch"
import { showError, showSuccess } from "#/components/Toaster"
import { CourseForm } from "#/features/admin-courses/CourseForm"
import { courseDetailQuery, useSetCoursePublished, useUpdateCourse } from "#/features/admin-courses/queries"
import { extractError } from "#/lib/api"

export const Route = createFileRoute("/_app/courses/$courseId")({
	component: CourseDetailPage,
})

function CourseDetailPage() {
	const { courseId } = Route.useParams()
	const navigate = useNavigate({ from: "/courses/$courseId" })

	const { data, isLoading } = useQuery(courseDetailQuery(courseId))
	const update = useUpdateCourse(courseId)
	const setPub = useSetCoursePublished()

	if (isLoading || !data) {
		return (
			<Flex vertical gap={16}>
				<AntSkeleton active />
			</Flex>
		)
	}

	const course = data.data

	async function togglePub(): Promise<void> {
		try {
			await setPub.mutateAsync({ id: course.id, published: !course.is_published })
			showSuccess(course.is_published ? "Đã đóng ghi danh." : "Đã mở ghi danh.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={24}>
			<div>
				<Link
					to="/courses"
					style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}
				>
					<ArrowLeftOutlined /> Danh sách
				</Link>
				<PageHeader
					title={course.title}
					subtitle={course.description ?? "—"}
					action={
						<Switch
							checked={course.is_published}
							onChange={togglePub}
							label={course.is_published ? "Đang mở ghi danh" : "Đã đóng"}
							disabled={setPub.isPending}
						/>
					}
				/>
				<Space size={4} wrap style={{ marginTop: 8 }}>
					<Tag color="blue">{course.target_level}</Tag>
					{course.target_exam_school && <Tag>{course.target_exam_school}</Tag>}
					<Tag>
						{course.enrollment_count ?? 0}/{course.max_slots} học viên
					</Tag>
					<Tag>
						Cam kết {course.required_full_tests} bài / {course.commitment_window_days} ngày
					</Tag>
					{course.teacher && <Tag color="purple">GV: {course.teacher.full_name}</Tag>}
				</Space>
			</div>

			<Card title="Cập nhật khóa học">
				<CourseForm
					initial={course}
					submitting={update.isPending}
					onCancel={() => navigate({ to: "/courses" })}
					onSubmit={async (input) => {
						await update.mutateAsync(input)
						showSuccess("Đã lưu thay đổi.")
					}}
				/>
			</Card>
		</Flex>
	)
}
