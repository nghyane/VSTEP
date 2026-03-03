import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const Route = createFileRoute("/_auth/login")({
	component: LoginPage,
})

function LoginPage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold tracking-tight">Đăng nhập</h2>
				<p className="mt-1 text-sm text-muted-foreground">Nhập email và mật khẩu để tiếp tục</p>
			</div>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" type="email" placeholder="you@example.com" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Mật khẩu</Label>
					<Input id="password" type="password" placeholder="••••••••" />
				</div>
				<Button className="w-full">Đăng nhập</Button>
			</div>
			<p className="text-center text-sm text-muted-foreground">
				Chưa có tài khoản?{" "}
				<Link to="/" className="text-primary hover:underline">
					Đăng ký
				</Link>
			</p>
		</div>
	)
}
