import { useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import { defaultSkill } from "#/features/exam/components/result/helpers"
import { McqSkillReview } from "#/features/exam/components/result/McqSkillReview"
import { ProductiveSkillReview } from "#/features/exam/components/result/ProductiveSkillReview"
import { ResultHeader } from "#/features/exam/components/result/ResultHeader"
import { ResultSkillTabs } from "#/features/exam/components/result/ResultSkillTabs"
import { ResultSummaryCard } from "#/features/exam/components/result/ResultSummaryCard"
import { buildResultViewModel } from "#/features/exam/components/result/view-model"
import type { SessionResultsData, SkillKey } from "#/features/exam/types"

export function ExamResultScreen({ result }: { result: SessionResultsData }) {
	const [activeSkill, setActiveSkill] = useState<SkillKey>(() => defaultSkill(result))
	const model = useMemo(() => buildResultViewModel(result), [result])

	const review = useMemo(() => {
		if (activeSkill === "listening" || activeSkill === "reading") {
			return <McqSkillReview result={result} skill={activeSkill} />
		}
		if (activeSkill === "writing") return <ProductiveSkillReview result={result} kind="writing" />
		return <ProductiveSkillReview result={result} kind="speaking" />
	}, [activeSkill, result])

	return (
		<div className="flex h-dvh min-h-[640px] flex-col bg-background text-foreground">
			<ResultHeader result={result} />
			<main className="mx-auto grid w-full min-h-0 max-w-7xl flex-1 gap-4 overflow-y-auto px-4 pb-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden lg:px-10">
				<aside className="min-h-0 lg:overflow-hidden">
					<ScrollArea className="min-h-0 lg:h-full" trackClassName="right-0" thumbClassName="bg-border">
						<div className="flex flex-col gap-3 lg:pr-3">
							<ResultSummaryCard model={model} />
						</div>
					</ScrollArea>
				</aside>

				<section className="card flex min-h-[560px] flex-col overflow-hidden bg-surface lg:min-h-0">
					<ResultSkillTabs skills={model.skills} activeSkill={activeSkill} onSelect={setActiveSkill} />
					<div className="min-h-0 flex-1">{review}</div>
				</section>
			</main>
		</div>
	)
}
