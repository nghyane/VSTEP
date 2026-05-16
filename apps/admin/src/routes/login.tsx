import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Alert, Button, Card, Flex, Form, Input, Typography } from "antd"
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

function LoginPage() {
	const setSession = useAuth((s) => s.setSession)
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState<string | null>(null)

	const mutation = useMutation({
		mutationFn: async () => {
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
		<Flex justify="center" align="center" style={{ minHeight: "100vh", padding: 16 }}>
			<Card style={{ width: "100%", maxWidth: 380 }}>
				<Typography.Title level={4} style={{ margin: 0 }}>
					VSTEP Admin
				</Typography.Title>
				<Typography.Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
					Đăng nhập để tiếp tục.
				</Typography.Text>
				<Form
					layout="vertical"
					onFinish={() => {
						setError(null)
						mutation.mutate()
					}}
				>
					<Form.Item label="Email" required>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="email"
						/>
					</Form.Item>
					<Form.Item label="Mật khẩu" required>
						<Input.Password
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
						/>
					</Form.Item>
					{error && <Alert type="error" description={error} style={{ marginBottom: 12 }} />}
					<Button type="primary" htmlType="submit" size="large" loading={mutation.isPending} block>
						Đăng nhập
					</Button>
				</Form>
			</Card>
		</Flex>
	)
}
