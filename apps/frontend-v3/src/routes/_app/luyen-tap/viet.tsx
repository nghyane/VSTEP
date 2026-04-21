import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"

export const Route = createFileRoute("/_app/luyen-tap/viet")({
	component: WritingPage,
})

function WritingPage() {
	return (
		<>
			<Header title="Viết" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">Thư + luận · AI chấm theo rubric Bộ GD</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="card p-6">
						<h4 className="font-bold text-lg text-foreground mb-2">Task 1 — Viết thư</h4>
						<p className="text-sm text-muted mb-4">
							Viết thư theo tình huống. AI chấm cấu trúc, ngữ pháp, từ vựng.
						</p>
						<span className="text-xs font-bold text-subtle">~120 từ · 20 phút</span>
					</div>
					<div className="card p-6">
						<h4 className="font-bold text-lg text-foreground mb-2">Task 2 — Viết luận</h4>
						<p className="text-sm text-muted mb-4">
							Viết luận nghị luận. AI chấm lập luận, mạch lạc, ngôn ngữ.
						</p>
						<span className="text-xs font-bold text-subtle">~250 từ · 40 phút</span>
					</div>
				</div>

				<div className="card p-10 text-center mt-6">
					<img src="/mascot/lac-write.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
					<p className="text-sm font-bold text-subtle">Chọn đề bài để bắt đầu luyện viết</p>
				</div>
			</div>
		</>
	)
}
