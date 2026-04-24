import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { SpeakingContent } from "#/features/practice/components/SpeakingContent"

export const Route = createFileRoute("/_app/luyen-tap/noi")({
	component: SpeakingPage,
})

function SpeakingPage() {
	return (
		<>
			<Header title="Nói" backTo="/luyen-tap" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">3 phần · ghi âm + AI đánh giá phát âm</p>
				<SpeakingContent />
			</div>
		</>
	)
}
