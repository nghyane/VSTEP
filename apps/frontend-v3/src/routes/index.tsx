import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { isAuthenticated } from "#/features/auth/auth"
import { LoginPage } from "#/features/auth/LoginPage"

export const Route = createFileRoute("/")({
	component: LandingPage,
})

function LandingPage() {
	const router = useRouter()
	const [showLogin, setShowLogin] = useState(false)

	if (isAuthenticated()) {
		router.navigate({ to: "/_app" })
		return null
	}

	return (
		<div className="min-h-screen bg-surface">
			{/* Nav */}
			<nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
				<span className="font-display text-3xl text-primary">VSTEP</span>
				<div className="flex items-center gap-3">
					<button type="button" onClick={() => setShowLogin(true)} className="btn btn-secondary">
						Đăng nhập
					</button>
					<button type="button" className="btn btn-primary">
						Đăng ký
					</button>
				</div>
			</nav>

			{/* Hero */}
			<section className="max-w-6xl mx-auto px-8 py-20 flex flex-col items-center text-center">
				<h1 className="font-extrabold text-5xl text-foreground leading-tight max-w-2xl">
					Luyện thi VSTEP hiệu quả với AI
				</h1>
				<p className="text-lg text-muted mt-5 max-w-xl">
					Luyện 4 kỹ năng Nghe — Đọc — Viết — Nói. Thi thử chuẩn format. AI chấm bài theo rubric Bộ Giáo dục.
				</p>
				<div className="flex gap-3 mt-8">
					<button
						type="button"
						onClick={() => setShowLogin(true)}
						className="btn btn-primary text-base px-8 py-3"
					>
						Bắt đầu miễn phí
					</button>
				</div>
			</section>

			{/* Login modal */}
			{showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
		</div>
	)
}
