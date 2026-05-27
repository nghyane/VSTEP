import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { GrammarCatalog } from "#/features/grammar/components/GrammarCatalog"
import { grammarPointsQuery } from "#/features/grammar/queries"

export const Route = createFileRoute("/_app/luyen-tap/ngu-phap/")({
	component: GrammarPage,
})

function GrammarPage() {
	const { data } = useQuery(grammarPointsQuery)

	if (!data) return <Header title="Ngữ pháp" backTo="/luyen-tap" />

	return (
		<>
			<Header title="Ngữ pháp" backTo="/luyen-tap" />
			<GrammarCatalog points={data.data} />
		</>
	)
}
