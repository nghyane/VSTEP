import {
	BarChartIcon,
	Book01Icon,
	HeadphonesIcon,
	PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Outlet } from "@tanstack/react-router"
import { Logo } from "@/components/common/Logo"

const features = [
	{
		icon: HeadphonesIcon,
		title: "4 kỹ năng đầy đủ",
		desc: "Listening, Reading, Writing & Speaking",
	},
	{
		icon: BarChartIcon,
		title: "Chấm điểm AI",
		desc: "Nhận phản hồi chi tiết theo tiêu chí VSTEP",
	},
	{
		icon: Book01Icon,
		title: "Đề thi thực tế",
		desc: "Bài thi mô phỏng sát format B1–B2–C1",
	},
	{
		icon: PencilEdit01Icon,
		title: "Theo dõi tiến độ",
		desc: "Biểu đồ điểm số và lộ trình cải thiện",
	},
]

export function AuthLayout() {
	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			<div className="hidden bg-muted p-12 lg:flex lg:flex-col lg:justify-between">
				<Logo size="lg" />
				<div className="space-y-3">
					<h1 className="text-2xl font-semibold tracking-tight">Luyện thi VSTEP hiệu quả</h1>
					<p className="text-muted-foreground">
						Nền tảng luyện thi trực tuyến với bài tập thực hành và chấm điểm AI
					</p>
					<div className="mt-8 grid grid-cols-2 gap-3">
						{features.map((f) => (
							<div key={f.title} className="rounded-xl bg-background p-4">
								<HugeiconsIcon icon={f.icon} className="size-5 text-primary" />
								<p className="mt-3 text-sm font-medium">{f.title}</p>
								<p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
							</div>
						))}
					</div>
				</div>
				<p className="text-xs text-muted-foreground">© 2026 VSTEP Practice</p>
			</div>
			<div className="flex flex-col items-center justify-center p-6">
				<div className="mb-8 lg:hidden">
					<Logo size="lg" />
				</div>
				<div className="w-full max-w-sm">
					<Outlet />
				</div>
			</div>
		</div>
	)
}
