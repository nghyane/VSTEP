import { StaticIcon } from "#/components/Icon"
import type { ExamDetail } from "#/features/exam/types"

interface Props {
	detail: ExamDetail
}

export function ExamDetailHeader({ detail }: Props) {
	const { exam, version } = detail

	const totalMcq =
		version.listening_sections.reduce((s, x) => s + x.items.length, 0) +
		version.reading_passages.reduce((s, x) => s + x.items.length, 0)
	const totalFreeResponse = version.writing_tasks.length + version.speaking_parts.length

	return (
		<div className="space-y-5">
			<div className="space-y-2">
				{exam.tags.length > 0 && (
					<div className="flex items-center gap-2 flex-wrap">
						{exam.tags.map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center rounded-full bg-background border-2 border-border px-2.5 py-0.5 text-xs font-medium text-subtle"
							>
								{tag}
							</span>
						))}
					</div>
				)}
				<h1 className="font-display text-2xl md:text-3xl leading-tight text-foreground">{exam.title}</h1>
			</div>

			<div className="card grid grid-cols-3 gap-px overflow-hidden bg-border-light">
				<MetaCell icon="timer-md" value={`${exam.total_duration_minutes}`} unit="phút" />
				<MetaCell icon="clipboard-md" value={`${totalMcq}`} unit="câu trắc nghiệm" />
				<MetaCell icon="pencil-md" value={`${totalFreeResponse}`} unit="phần tự luận" />
			</div>
		</div>
	)
}

function MetaCell({
	icon,
	value,
	unit,
}: {
	icon: "timer-md" | "clipboard-md" | "pencil-md"
	value: string
	unit: string
}) {
	return (
		<div className="flex items-center gap-2.5 bg-surface px-4 py-3">
			<StaticIcon name={icon} size="sm" />
			<div className="flex flex-col leading-tight">
				<span className="font-extrabold text-foreground tabular-nums text-base">{value}</span>
				<span className="text-xs text-subtle">{unit}</span>
			</div>
		</div>
	)
}
