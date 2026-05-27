import { createFileRoute, redirect } from "@tanstack/react-router"
import { Button, Card, Empty, Typography } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/teacher/leave-requests")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "teacher") throw redirect({ to: "/" })
	},
	component: TeacherLeaveRequests,
})

function TeacherLeaveRequests() {
	return (
		<div>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
				<Typography.Title level={3} style={{ margin: 0 }}>Xin nghỉ</Typography.Title>
				<Button type="primary" icon={<PlusOutlined />}>Tạo đơn xin nghỉ</Button>
			</div>
			<Card>
				<Empty description="Chưa có đơn xin nghỉ nào" />
			</Card>
		</div>
	)
}
