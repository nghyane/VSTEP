import { ArrowLeftOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Skeleton as AntSkeleton, Flex, Space, Tag } from "antd"
import { Card } from "#/components/Card"
import { PageHeader } from "#/components/PageHeader"
import { Switch } from "#/components/Switch"
import { Tabs } from "#/components/Tabs"
import { showError, showSuccess } from "#/components/Toaster"
import { BookingsTab } from "#/features/admin-courses/BookingsTab"
import { CourseForm } from "#/features/admin-courses/CourseForm"
import { EnrollmentsTab } from "#/features/admin-courses/EnrollmentsTab"
import { courseDetailQuery, useSetCoursePublished, useUpdateCourse } from "#/features/admin-courses/queries"
import { ScheduleItemsTab } from "#/features/admin-courses/ScheduleItemsTab"
import { SlotsTab } from "#/features/admin-courses/SlotsTab"
import { extractError } from "#/lib/api"

type CourseTab = "info" | "schedule" | "enrollments" | "slots" | "bookings"

interface Search {
	tab?: CourseTab
}

const TABS: CourseTab[] = ["info", "schedule", "enrollments", "slots", "bookings"]

export const Route = createFileRoute("/_app/courses/$courseId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: TABS.includes(s.tab as CourseTab) ? (s.tab as CourseTab) : undefined,
	}),
	component: CourseDetailPage,
})

function CourseDetailPage() {
	const { courseId } = Route.useParams()
	const search = Route.useSearch()
	const tab = search.tab ?? "info"
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
					style={{
						fontSize: 12,
						display: "inline-flex",
						alignItems: "center",
						gap: 6,
						marginBottom: 8,
					}}
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

			<Tabs
				tabs={[
					{ label: "Thông tin", value: "info" },
					{
						label: `Buổi học${course.schedule_item_count != null ? ` (${course.schedule_item_count})` : ""}`,
						value: "schedule",
					},
					{
						label: `Học viên${course.enrollment_count != null ? ` (${course.enrollment_count})` : ""}`,
						value: "enrollments",
					},
					{ label: "Lịch 1-1", value: "slots" },
					{ label: "Booking 1-1", value: "bookings" },
				]}
				active={tab}
				onChange={(v) => navigate({ search: { tab: v as Search["tab"] } })}
			/>

			{tab === "info" && (
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
			)}

			{tab === "schedule" && (
				<Card title="Lịch các buổi học">
					<ScheduleItemsTab
						courseId={courseId}
						courseStartDate={course.start_date}
						courseEndDate={course.end_date}
					/>
				</Card>
			)}

			{tab === "enrollments" && (
				<Card title="Học viên đã ghi danh">
					<EnrollmentsTab courseId={courseId} />
				</Card>
			)}

			{tab === "slots" && (
				<Card title="Lịch rảnh giáo viên — buổi 1-1">
					<SlotsTab courseId={courseId} courseStartDate={course.start_date} courseEndDate={course.end_date} />
				</Card>
			)}

			{tab === "bookings" && (
				<Card title="Booking 1-1 đã đặt">
					<BookingsTab courseId={courseId} />
				</Card>
			)}
		</Flex>
	)
}
