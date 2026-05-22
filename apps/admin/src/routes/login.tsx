import { ArrowRightOutlined, LockOutlined, MailOutlined } from "@ant-design/icons"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Alert, Button, Form, Input, Typography, theme } from "antd"
import { useState } from "react"
import { type ApiResponse, api, extractError } from "#/lib/api"
import { type AdminRole, useAuth } from "#/lib/auth"

interface LoginResponse {
	access_token: string
	user: {
		id: string
		email: string
		full_name: string
		role: AdminRole
	}
}

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		const { token, user } = useAuth.getState()
		if (token && user) throw redirect({ to: "/" })
	},
	component: LoginPage,
})

const HERO_IMAGE_URL =
	"https://images.unsplash.com/photo-1488751045188-3c55bbf9a3fa?auto=format&fit=crop&w=1400&q=80"

function LoginPage() {
	const { token } = theme.useToken()
	const setSession = useAuth((s) => s.setSession)
	const [form] = Form.useForm<{ email: string; password: string }>()
	const [error, setError] = useState<string | null>(null)

	const mutation = useMutation({
		mutationFn: async () => {
			const { email, password } = form.getFieldsValue()
			const res = await api
				.post("auth/login", { json: { email, password } })
				.json<ApiResponse<LoginResponse>>()
			return res.data
		},
		onSuccess: (data) => {
			const user = data.user
			if (!["admin", "staff", "teacher"].includes(user.role)) {
				setError("Tài khoản không có quyền truy cập admin panel.")
				return
			}
			setSession(data.access_token, {
				id: user.id,
				email: user.email,
				name: user.full_name,
				role: user.role,
			})
			window.location.href = "/"
		},
		onError: async (err) => {
			const { message } = await extractError(err)
			setError(message || "Đăng nhập thất bại")
		},
	})

	return (
		<div style={{ display: "flex", minHeight: "100vh", background: token.colorBgLayout }}>
			{/* Left — hero image (hidden on mobile) */}
			<div
				style={{
					flex: 1.2,
					position: "relative",
					backgroundImage: `linear-gradient(135deg, rgba(37,99,235,0.85) 0%, rgba(124,58,237,0.75) 100%), url(${HERO_IMAGE_URL})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					display: "none",
				}}
				className="login-hero"
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						padding: "56px 64px",
						color: "#fff",
					}}
				>
					<div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 0.5 }}>VSTEP Admin</div>
					<div>
						<div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
							Quản trị nội dung & đánh giá VSTEP
						</div>
						<div style={{ fontSize: 16, opacity: 0.9, maxWidth: 520, lineHeight: 1.6 }}>
							Hệ thống quản lý đề thi, từ vựng, ngữ pháp và luyện tập 4 kỹ năng. Theo dõi doanh thu, người
							dùng và hoạt động học tập theo thời gian thực.
						</div>
					</div>
					<div style={{ fontSize: 13, opacity: 0.7 }}>
						© {new Date().getFullYear()} VSTEP Practice Platform
					</div>
				</div>
			</div>

			{/* Right — login form */}
			<div
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "48px 24px",
					background: token.colorBgContainer,
				}}
			>
				<div style={{ width: "100%", maxWidth: 420 }}>
					<Typography.Title level={2} style={{ margin: 0, marginBottom: 8, fontWeight: 700 }}>
						Chào mừng quay lại
					</Typography.Title>
					<Typography.Text type="secondary" style={{ fontSize: 15, display: "block", marginBottom: 36 }}>
						Đăng nhập vào tài khoản quản trị viên để tiếp tục.
					</Typography.Text>

					<Form
						form={form}
						layout="vertical"
						size="large"
						requiredMark={false}
						onFinish={() => {
							setError(null)
							mutation.mutate()
						}}
					>
						<Form.Item
							name="email"
							label={<span style={{ fontWeight: 500 }}>Email</span>}
							rules={[
								{ required: true, message: "Vui lòng nhập email." },
								{ type: "email", message: "Email không hợp lệ." },
							]}
						>
							<Input
								id="email"
								prefix={<MailOutlined style={{ color: token.colorTextPlaceholder, marginInlineEnd: 4 }} />}
								placeholder="admin@vstep.test"
								autoComplete="email"
								style={{ height: 48 }}
							/>
						</Form.Item>
						<Form.Item
							name="password"
							label={<span style={{ fontWeight: 500 }}>Mật khẩu</span>}
							style={{ marginBottom: 12 }}
							rules={[{ required: true, message: "Vui lòng nhập mật khẩu." }]}
						>
							<Input.Password
								id="password"
								prefix={<LockOutlined style={{ color: token.colorTextPlaceholder, marginInlineEnd: 4 }} />}
								placeholder="Nhập mật khẩu"
								autoComplete="current-password"
								style={{ height: 48 }}
							/>
						</Form.Item>

						{error && (
							<Alert
								type="error"
								description={error}
								showIcon
								style={{ marginBottom: 16, borderRadius: token.borderRadius }}
							/>
						)}

						<Button
							type="primary"
							htmlType="submit"
							size="large"
							loading={mutation.isPending}
							icon={!mutation.isPending && <ArrowRightOutlined />}
							iconPlacement="end"
							block
							style={{ height: 48, fontWeight: 600, marginTop: 8 }}
						>
							Đăng nhập
						</Button>
					</Form>

					<Typography.Text
						type="secondary"
						style={{ fontSize: 13, display: "block", textAlign: "center", marginTop: 32 }}
					>
						Cần hỗ trợ? Liên hệ quản trị hệ thống.
					</Typography.Text>
				</div>
			</div>

			<style>{`
				@media (min-width: 992px) {
					.login-hero { display: block !important; }
				}
			`}</style>
		</div>
	)
}
