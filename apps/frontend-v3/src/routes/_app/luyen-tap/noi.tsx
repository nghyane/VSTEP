import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"

export const Route = createFileRoute("/_app/luyen-tap/noi")({
	component: SpeakingPage,
})

function SpeakingPage() {
	return (
		<>
			<Header title="Nói" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">3 phần · ghi âm + AI đánh giá phát âm</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="card p-6">
						<h4 className="font-bold text-lg text-foreground mb-2">Drill phát âm</h4>
						<p className="text-sm text-muted mb-4">
							Luyện phát âm từng câu. AI đánh giá pronunciation score.
						</p>
						<span className="text-xs font-bold text-subtle">Ngắn · Lặp lại nhiều lần</span>
					</div>
					<div className="card p-6">
						<h4 className="font-bold text-lg text-foreground mb-2">VSTEP Speaking</h4>
						<p className="text-sm text-muted mb-4">3 phần theo format VSTEP. Ghi âm + AI chấm.</p>
						<span className="text-xs font-bold text-subtle">~12 phút · 3 parts</span>
					</div>
				</div>

				<div className="card p-10 text-center mt-6">
					<img src="/mascot/lac-speak.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
					<p className="text-sm font-bold text-subtle">Chọn chế độ luyện nói</p>
				</div>
			</div>
		</>
	)
}
