import { LinkOutlined } from "@ant-design/icons"
import { Descriptions, Modal, Tag, Typography } from "antd"
import type { ScheduleEvent } from "./types"

interface Props {
	event: ScheduleEvent | null
	onClose: () => void
}

export function EventDetailModal({ event, onClose }: Props) {
	return (
		<Modal
			centered
			open={event !== null}
			title="Chi tiết lịch dạy"
			onCancel={onClose}
			footer={null}
			width={640}
		>
			{event && (
				<Descriptions bordered column={1} size="small">
					<Descriptions.Item label="Loại lịch">
						<Tag color={event.kind === "class" ? "blue" : "green"}>
							{event.kind === "class" ? "Lớp học" : "1-1"}
						</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Khóa học">{event.courseTitle}</Descriptions.Item>
					<Descriptions.Item label="Thời gian">
						{event.date} · {event.start}-{event.end}
					</Descriptions.Item>
					{event.kind === "class" ? (
						<Descriptions.Item label="Buổi học">
							Buổi {event.sessionNumber.toString().padStart(2, "0")} · {event.topic}
						</Descriptions.Item>
					) : (
						<Descriptions.Item label="Học viên">{event.studentName ?? "Chưa có học viên"}</Descriptions.Item>
					)}
					{event.kind === "slot" && <Descriptions.Item label="Trạng thái">{event.status}</Descriptions.Item>}
					<Descriptions.Item label="Google Meet">
						{event.meetUrl ? (
							<Typography.Link href={event.meetUrl} target="_blank" rel="noreferrer">
								<LinkOutlined /> Mở link Meet
							</Typography.Link>
						) : (
							<Typography.Text type="secondary">Chưa có link</Typography.Text>
						)}
					</Descriptions.Item>
				</Descriptions>
			)}
		</Modal>
	)
}
