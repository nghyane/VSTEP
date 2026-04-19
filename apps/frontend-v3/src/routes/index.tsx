import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import checkIcon from "#/assets/icons/check-small.svg"
import streakIcon from "#/assets/icons/streak-medium.svg"
import targetIcon from "#/assets/icons/target-medium.svg"
import { useAuth } from "#/features/auth/AuthProvider"
import { LoginPage } from "#/features/auth/LoginPage"
import { skills } from "#/lib/skills"

export const Route = createFileRoute("/")({
	component: LandingPage,
})

const FEATURES = [
	{
		icon: targetIcon,
		title: "Thi thử chuẩn VSTEP",
		desc: "Đề thi từ ngân hàng đề HNUE, Văn Lang. Timer server, format chuẩn Bộ GD.",
	},
	{
		icon: streakIcon,
		title: "Luyện tập mỗi ngày",
		desc: "Từ vựng SRS, ngữ pháp theo level, 4 kỹ năng với chế độ hỗ trợ.",
	},
	{
		icon: checkIcon,
		title: "AI chấm bài chi tiết",
		desc: "Điểm mạnh → Cần cải thiện → Gợi ý viết lại. Theo rubric Bộ Giáo dục.",
	},
]

function LandingPage() {
	const { isAuthenticated } = useAuth()
	const navigate = useNavigate()
	const [showLogin, setShowLogin] = useState(false)

	if (isAuthenticated) {
		navigate({ to: "/dashboard" })
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
						Bắt đầu miễn phí
					</button>
				</div>
			</nav>

			{/* Hero */}
			<section className="max-w-6xl mx-auto px-8 pt-16 pb-20 flex flex-col items-center text-center">
				<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-tint text-primary text-sm font-bold mb-6">
					<img src={checkIcon} className="w-4 h-4" alt="" />
					Miễn phí · 100 xu khi đăng ký
				</div>
				<h1 className="font-extrabold text-5xl md:text-6xl text-foreground leading-tight max-w-3xl">
					Luyện thi VSTEP đạt B2 với AI
				</h1>
				<p className="text-lg text-muted mt-5 max-w-xl">
					Luyện 4 kỹ năng. Thi thử chuẩn format. AI chấm bài theo rubric Bộ Giáo dục. Theo dõi tiến độ đến
					ngày thi.
				</p>
				<button
					type="button"
					onClick={() => setShowLogin(true)}
					className="btn btn-primary text-base px-10 py-3.5 mt-8"
				>
					Bắt đầu miễn phí
				</button>
			</section>

			{/* 4 Skills */}
			<section className="max-w-6xl mx-auto px-8 pb-20">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{skills.map((s) => (
						<div key={s.key} className="card p-5 text-center">
							<s.Icon className="h-10 w-auto mx-auto mb-3" style={{ color: s.color }} />
							<h3 className="font-bold text-base text-foreground">{s.label}</h3>
							<p className="text-sm text-subtle mt-1">{s.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* Features */}
			<section className="bg-background py-20">
				<div className="max-w-6xl mx-auto px-8">
					<h2 className="font-extrabold text-3xl text-foreground text-center mb-12">Tại sao chọn VSTEP?</h2>
					<div className="grid md:grid-cols-3 gap-6">
						{FEATURES.map((f) => (
							<div key={f.title} className="card p-6">
								<img src={f.icon} className="h-12 w-auto mb-4" alt="" />
								<h3 className="font-bold text-lg text-foreground">{f.title}</h3>
								<p className="text-sm text-muted mt-2 leading-relaxed">{f.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA bottom */}
			<section className="max-w-6xl mx-auto px-8 py-20 text-center">
				<h2 className="font-extrabold text-3xl text-foreground mb-4">Sẵn sàng đạt mục tiêu?</h2>
				<p className="text-muted text-lg mb-8">Đăng ký miễn phí, nhận 100 xu, bắt đầu luyện tập ngay.</p>
				<button
					type="button"
					onClick={() => setShowLogin(true)}
					className="btn btn-primary text-base px-10 py-3.5"
				>
					Đăng ký ngay
				</button>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-8 text-center text-sm text-subtle">
				© 2025 VSTEP · Luyện thi chứng chỉ tiếng Anh quốc gia
			</footer>

			{/* Login modal */}
			{showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
		</div>
	)
}
