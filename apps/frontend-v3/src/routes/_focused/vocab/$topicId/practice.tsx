import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect } from "react"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { PracticeFlow } from "#/features/vocab/components/PracticeFlow"
import { vocabTopicDetailQuery } from "#/features/vocab/queries"
import type { PracticeMode } from "#/features/vocab/types"

const MODES: PracticeMode[] = ["flashcard", "typing", "listen", "reverse", "fill_blank", "mixed"]

function isMode(v: unknown): v is PracticeMode {
	return typeof v === "string" && (MODES as string[]).includes(v)
}

export const Route = createFileRoute("/_focused/vocab/$topicId/practice")({
	validateSearch: (s: Record<string, unknown>): { mode: PracticeMode } => ({
		mode: isMode(s.mode) ? s.mode : "flashcard",
	}),
	component: PracticePage,
})

function PracticePage() {
	const qc = useQueryClient()
	const { topicId } = Route.useParams()
	const { mode } = Route.useSearch()
	const { data } = useQuery(vocabTopicDetailQuery(topicId))
	const back = { backTo: "/luyen-tap/tu-vung/$topicId", backParams: { topicId } }

	const invalidate = useCallback(() => {
		qc.invalidateQueries({ queryKey: ["vocab", "topics", topicId] })
		qc.invalidateQueries({ queryKey: ["vocab", "topics"], exact: true })
	}, [qc, topicId])

	useEffect(() => invalidate, [invalidate])

	if (!data) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar {...back} current={0} total={0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">Đang tải...</p>
				</div>
			</div>
		)
	}

	return <PracticeFlow words={data.data.words} mode={mode} back={back} />
}
