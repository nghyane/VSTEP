import { StaticIcon } from "#/components/Icon"
import { SkillChip } from "#/components/SkillChip"
import type { ExamDetail, SkillKey } from "#/features/exam/types"

interface Props {
	detail: ExamDetail
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

export function ExamDetailHeader({ detail }: Props) {
	const { exam, version } = detail

	const totalMcq =
		version.listening_sections.reduce((s, x) => s + x.items.length, 0) +
		version.reading_passages.reduce((s, x) => s + x.items.length, 0)
	const totalFreeResponse = version.writing_tasks.length + version.speaking_parts.length
	// Tính tổng phút từ parts (nguồn thật) thay vì field BE có thể lệch.
	const totalMinutes =
		version.listening_sections.reduce((s, x) => s + x.duration_minutes, 0) +
		version.reading_passages.reduce((s, x) => s + x.duration_minutes, 0) +
		version.writing_tasks.reduce((s, x) => s + x.duration_minutes, 0) +
		version.speaking_parts.reduce((s, x) => s + x.duration_minutes, 0)

	return (
		<div className="space-y-4">
			{/* Tags + title */}
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
				<h1 className="text-2xl font-extrabold leading-tight text-foreground">{exam.title}</h1>
			</div>

			{/* Aggregate meta */}
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<MetaPill>
					<StaticIcon name="timer-md" size="xs" />
					<span className="font-bold text-foreground">{totalMinutes}</span>
					<span className="text-subtle">phút</span>
				</MetaPill>
				<MetaPill>
					<StaticIcon name="target-md" size="xs" />
					<span className="font-bold text-foreground">4</span>
					<span className="text-subtle">kỹ năng</span>
				</MetaPill>
				<MetaPill>
					<StaticIcon name="clipboard-md" size="xs" />
					<span className="font-bold text-foreground">{totalMcq}</span>
					<span className="text-subtle">câu trắc nghiệm</span>
				</MetaPill>
				<MetaPill>
					<StaticIcon name="pencil-md" size="xs" />
					<span className="font-bold text-foreground">{totalFreeResponse}</span>
					<span className="text-subtle">phần tự luận</span>
				</MetaPill>
			</div>

			{/* Skill chips */}
			<div className="flex flex-wrap gap-1.5">
				{SKILL_ORDER.map((skill) => (
					<SkillChip key={skill} skill={skill} size="md" />
				))}
			</div>
		</div>
	)
}

function MetaPill({ children }: { children: React.ReactNode }) {
	return (
		<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border-light text-xs">
			{children}
		</span>
	)
}
