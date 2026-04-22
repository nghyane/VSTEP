import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { SrsHero } from "#/features/vocab/components/SrsHero"
import { TopicGrid } from "#/features/vocab/components/TopicGrid"

export const Route = createFileRoute("/_app/luyen-tap/tu-vung/")({
	component: VocabPage,
})

function VocabPage() {
	return (
		<>
			<Header title="Từ vựng" backTo="/luyen-tap" />
			<div className="px-10 pb-12 space-y-8">
				<SrsHero />
				<TopicGrid />
			</div>
		</>
	)
}
