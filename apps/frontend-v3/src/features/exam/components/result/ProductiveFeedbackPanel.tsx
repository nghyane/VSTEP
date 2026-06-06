import type { ReactNode } from "react"
import type { ProductiveItem } from "#/features/exam/components/result/productive-model"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { feedbackImprovements } from "#/features/grading/feedback"

export function ProductiveFeedbackPanel({ item }: { readonly item: ProductiveItem }) {
	if (item.display?.ui.show_feedback === false) return null

	const hasInsights = item.scoreInsights.length > 0
	const feedback = item.feedback
	const improvements = feedbackImprovements(feedback)
	const strengths = feedback?.strengths ?? []
	const rewrites = feedback?.rewrites ?? []
	const hasCoachFeedback = improvements.length > 0 || strengths.length > 0 || rewrites.length > 0

	if (!hasInsights && !hasCoachFeedback) return null

	return (
		<div className="space-y-4">
			{hasInsights && <ScoreInsights insights={item.scoreInsights} />}
			{hasCoachFeedback && (
				<Section title="Nhận xét AI">
					<div className="space-y-4">
						<FeedbackSection strengths={strengths} improvements={improvements} />
						{rewrites.length > 0 && <RewriteSection rewrites={rewrites} />}
					</div>
				</Section>
			)}
		</div>
	)
}

function ScoreInsights({ insights }: { readonly insights: ProductiveItem["scoreInsights"] }) {
	return (
		<Section title="Vì sao có điểm này">
			<div className="grid gap-3 sm:grid-cols-2">
				{insights.map((insight) => (
					<div key={`${insight.key}-${insight.label}`} className="rounded-2xl bg-background/50 p-3">
						<p className="text-sm font-black text-foreground">{insight.label}</p>
						<p className="mt-1 text-sm leading-6 text-muted">{insight.detail}</p>
					</div>
				))}
			</div>
		</Section>
	)
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
	return (
		<section className="rounded-(--radius-card) border-2 border-border bg-surface p-4">
			<p className="text-xs font-black uppercase tracking-[0.14em] text-muted">{title}</p>
			<div className="mt-3">{children}</div>
		</section>
	)
}
