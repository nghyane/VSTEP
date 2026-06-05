import { useMemo, useState } from "react"
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
			<main className="mx-auto flex w-full min-h-0 max-w-7xl flex-1 flex-col overflow-hidden px-3 py-3 sm:px-5 lg:px-6">
				<ResultSummaryBanner result={result} />
				<SkillTabs result={result} activeSkill={activeSkill} onSelect={setActiveSkill} />
				<section className="mt-3 min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
					{review}
				</section>
			</main>
		</div>
	)
}
