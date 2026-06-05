import { SkillIcon } from "#/components/SkillIcon"
import type { ExamOverview, SkillKey } from "#/features/exam/types"
import { skills } from "#/lib/skills"
import { cn } from "#/lib/utils"

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

interface Props {
	overview: ExamOverview
	mode: "full" | "custom"
	selected: Set<SkillKey>
	onChangeMode: (mode: "full" | "custom") => void
	onToggleSkill: (skill: SkillKey) => void
}

export function ExamModeSelector({ overview, mode, selected, onChangeMode, onToggleSkill }: Props) {
	return (
		<div className="border-t border-border-light pt-5">
			<div className="mb-3">
				<span className="text-sm font-extrabold text-foreground">Phạm vi làm bài</span>
				<p className="mt-0.5 text-xs text-subtle">Chọn làm đủ đề hoặc luyện riêng kỹ năng.</p>
			</div>

			<div className="mb-4 grid rounded-(--radius-card) border-2 border-border bg-background p-1 sm:grid-cols-2">
				<ModeButton active={mode === "full"} label="Đủ 4 kỹ năng" onClick={() => onChangeMode("full")} />
				<ModeButton active={mode === "custom"} label="Luyện kỹ năng" onClick={() => onChangeMode("custom")} />
			</div>

			{mode === "full" ? (
				<div className="space-y-3 rounded-(--radius-card) border border-border bg-surface px-4 py-3">
					<p className="text-sm font-bold text-foreground">Làm đủ Nghe, Đọc, Viết, Nói theo cấu trúc đề.</p>
					<div className="grid gap-2 sm:grid-cols-4">
						{SKILL_ORDER.map((skill) => (
							<SkillChip key={skill} skill={skill} overview={overview} />
						))}
					</div>
					<p className="text-xs text-subtle">Bạn sẽ đi lần lượt qua từng kỹ năng trong phòng thi.</p>
				</div>
			) : (
				<div className="space-y-2">
					<p className={cn("text-xs font-bold", selected.size === 0 ? "text-warning" : "text-subtle")}>
						{selected.size === 0 ? "Chọn ít nhất 1 kỹ năng để bắt đầu." : `Đã chọn ${selected.size} kỹ năng.`}
					</p>
					<div className="grid gap-3 sm:grid-cols-2">
						{SKILL_ORDER.map((skill) => (
							<SkillChoiceCard
								key={skill}
								skill={skill}
								overview={overview}
								checked={selected.has(skill)}
								onToggle={() => onToggleSkill(skill)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-(--radius-button) px-3 py-2 text-sm font-extrabold transition-colors",
				active ? "bg-surface text-primary shadow-sm" : "text-subtle hover:text-foreground",
			)}
		>
			{label}
		</button>
	)
}

function SkillChip({ skill, overview }: { skill: SkillKey; overview: ExamOverview }) {
	const skillDef = skills.find((item) => item.key === skill)
	const { minutes, countLabel } = getSkillTotals(skill, overview)

	return (
		<div className="rounded-(--radius-button) border border-border bg-background px-3 py-2">
			<div className="flex items-center gap-2">
				{skillDef && <SkillIcon name={skillDef.pngIcon} size="xs" />}
				<span className="text-sm font-extrabold text-foreground">{skillDef?.label}</span>
			</div>
			<p className="mt-1 text-[11px] font-semibold text-subtle">
				{minutes} phút · {countLabel}
			</p>
		</div>
	)
}

function SkillChoiceCard({
	skill,
	overview,
	checked,
	onToggle,
}: {
	skill: SkillKey
	overview: ExamOverview
	checked: boolean
	onToggle: () => void
}) {
	const skillDef = skills.find((item) => item.key === skill)
	const { minutes, countLabel } = getSkillTotals(skill, overview)

	return (
		<label
			className={cn(
				"relative cursor-pointer rounded-(--radius-card) border-2 bg-surface p-4 transition-colors hover:border-primary/30",
				checked ? "border-primary/40 bg-primary-tint" : "border-border",
			)}
		>
			<input
				type="checkbox"
				className="sr-only"
				checked={checked}
				onChange={onToggle}
				aria-label={skillDef?.label}
			/>
			<div className="flex items-start gap-3 pr-7">
				{skillDef && <SkillIcon name={skillDef.pngIcon} size="sm" />}
				<div className="min-w-0">
					<p className="text-sm font-extrabold text-foreground">{skillDef?.label}</p>
					<p className="mt-1 text-xs font-semibold text-subtle">
						{minutes} phút · {countLabel}
					</p>
				</div>
			</div>
			<span
				className={cn(
					"absolute right-3 top-3 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
					checked ? "border-primary bg-primary" : "border-border bg-surface",
				)}
			>
				{checked && <CheckMark />}
			</span>
		</label>
	)
}

function getSkillTotals(skill: SkillKey, overview: ExamOverview): { minutes: number; countLabel: string } {
	const summary = overview.skill_summaries[skill]
	const countLabel =
		skill === "listening" || skill === "reading" ? `${summary.item_count} câu` : `${summary.part_count} phần`
	return { minutes: summary.duration_minutes, countLabel }
}

function CheckMark() {
	return (
		<svg
			viewBox="0 0 12 10"
			className="h-3 w-3 text-white"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<polyline points="1,5 4.5,8.5 11,1" />
		</svg>
	)
}
