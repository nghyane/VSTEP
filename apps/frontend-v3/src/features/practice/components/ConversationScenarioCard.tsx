import type { ConversationScenario } from "#/features/practice/types"

interface Props {
	scenario: ConversationScenario
}

export function ConversationScenarioCard({ scenario }: Props) {
	return (
		<div className="rounded-(--radius-card) border-2 border-border bg-surface px-6 py-5 text-center">
			<p className="text-[10px] font-extrabold text-subtle uppercase tracking-[0.18em]">Kịch bản</p>
			<p className="mt-1.5 font-extrabold text-lg text-foreground">{scenario.title}</p>
			<p className="mt-2 text-sm text-muted leading-relaxed">{scenario.description}</p>
		</div>
	)
}
