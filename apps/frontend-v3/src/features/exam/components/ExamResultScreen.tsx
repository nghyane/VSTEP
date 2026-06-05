import { useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import { defaultSkill, mcqGroups } from "#/features/exam/components/result/helpers"
import { McqReviewPanel } from "#/features/exam/components/result/McqReviewPanel"
import { ResultHeader } from "#/features/exam/components/result/ResultHeader"
import { ResultSummaryBanner } from "#/features/exam/components/result/ResultSummaryBanner"
import { SkillTabs } from "#/features/exam/components/result/SkillTabs"
import { SpeakingReviewPanel } from "#/features/exam/components/result/SpeakingReviewPanel"
import { WritingReviewPanel } from "#/features/exam/components/result/WritingReviewPanel"
import type { SessionResultsData, SkillKey } from "#/features/exam/types"

export function ExamResultScreen({ result }: { result: SessionResultsData }) {
	const [activeSkill, setActiveSkill] = useState<SkillKey>(() => defaultSkill(result))

	const review = useMemo(() => {
		if (activeSkill === "listening" || activeSkill === "reading") {
			return <McqReviewPanel groups={mcqGroups(result, activeSkill)} />
		}
		if (activeSkill === "writing") return <WritingReviewPanel result={result} />
		return <SpeakingReviewPanel result={result} />
	}, [activeSkill, result])

	return (
		<div className="flex h-dvh min-h-[640px] flex-col bg-background text-foreground">
			<ResultHeader result={result} />
			<main className="mx-auto grid w-full min-h-0 max-w-7xl flex-1 gap-4 overflow-y-auto px-3 py-4 sm:px-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden lg:px-6">
				<aside className="min-h-0 lg:overflow-hidden">
					<ScrollArea className="min-h-0 lg:h-full" trackClassName="right-0" thumbClassName="bg-border">
						<div className="flex flex-col gap-3 lg:pr-3">
							<ResultSummaryBanner result={result} />
							<SkillTabs result={result} activeSkill={activeSkill} onSelect={setActiveSkill} />
						</div>
					</ScrollArea>
				</aside>

				<section className="min-h-[560px] overflow-hidden rounded-2xl border border-border bg-surface shadow-sm lg:min-h-0">
					{review}
				</section>
			</main>
		</div>
	)
}
