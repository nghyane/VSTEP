// ConfirmationStep — mission briefing style, vertical list (confirm handled by dialog footer)
// Spec: compact vertical rows với 3D shadow + skill accent bar, celebratory mood

import { BookOpen, Calendar, Flag, Headphones, Mic, PencilLine, Rocket, Target } from "lucide-react"
import { Fragment } from "react"
import type { Level, Motivation, OnboardingData, Skill } from "#/lib/onboarding/types"
import { cn } from "#/lib/utils"

interface Props {
	data: OnboardingData
}

function formatDate(date: Date): string {
	return date.toLocaleDateString("vi-VN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	})
}

function daysBetween(from: Date, to: Date): number {
	const ms = to.getTime() - from.getTime()
	return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

const LEVEL_ORDER: Record<Level, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 }

const SKILL_ICONS: Record<Skill, React.ComponentType<{ className?: string }>> = {
	listening: Headphones,
	reading: BookOpen,
	writing: PencilLine,
	speaking: Mic,
}

const SKILL_COLORS: Record<Skill, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

const MOTIVATION_META: Record<Motivation, string> = {
	graduation: "Thi ngoại ngữ",
	job_requirement: "Công việc",
	scholarship: "Học bổng",
	personal: "Tự tin giao tiếp",
	certification: "Chứng chỉ",
}

// ─── 3D shadow row ─────────────────────────────────────────────────

interface RowProps {
	accent: string
	icon: React.ComponentType<{ className?: string }>
	label: string
	value: string
}

function ShadowRow({ accent, icon: Icon, label, value }: RowProps) {
	return (
		<div className="group relative">
			{/* Shadow offset */}
			<div className="absolute inset-0 translate-x-[2px] translate-y-[2px] rounded-lg bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
			{/* Main row */}
			<div className="relative flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 shadow-sm transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-md">
				{/* Skill accent bar */}
				<div className={cn("h-6 w-0.5 shrink-0 rounded-full", accent)} />
				{/* Icon */}
				<Icon className="size-3.5 shrink-0 text-muted-foreground" />
				{/* Label + value */}
				<div className="min-w-0 flex-1">
					<p className="truncate text-[11px] font-semibold text-foreground">{value}</p>
				</div>
				{/* Sub label */}
				<p className="truncate text-[10px] text-muted-foreground">{label}</p>
			</div>
		</div>
	)
}

// ─── Level track (horizontal dots) ─────────────────────────────────

function LevelTrack({ entry, target }: { entry: Level; target: Level }) {
	const allLevels: Level[] = ["A1", "A2", "B1", "B2", "C1"]
	const entryNum = LEVEL_ORDER[entry]

	return (
		<div className="space-y-1.5">
			{/* Dots row — dots cố định width, connectors fill khoảng giữa */}
			<div className="relative flex items-center">
				{allLevels.map((lvl, i) => {
					const num = LEVEL_ORDER[lvl]
					const isDone = num < entryNum
					const isEntry = lvl === entry
					const isTarget = lvl === target

					return (
						<Fragment key={lvl}>
							{/* Connector trước dot (trừ dot đầu) */}
							{i > 0 && (
								<div className={cn("h-0.5 flex-1", num <= entryNum ? "bg-primary" : "bg-border")} />
							)}
							{/* Dot — cố định, không stretch */}
							<div
								className={cn(
									"relative z-10 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
									isDone && "border-primary bg-primary",
									isEntry &&
										!isTarget &&
										"border-primary bg-primary shadow-[0_0_0_3px_rgba(26,110,245,0.25)]",
									isTarget && "border-primary bg-primary shadow-[0_0_0_3px_rgba(26,110,245,0.25)]",
									!isDone && !isEntry && !isTarget && "border-border bg-background",
								)}
							>
								{isTarget && <Target className="absolute size-2 text-primary-foreground" />}
							</div>
						</Fragment>
					)
				})}
			</div>

			{/* Labels */}
			<div className="flex justify-between px-0.5">
				<span className="text-[9px] text-muted-foreground">{entry}</span>
				<span className="text-[9px] font-semibold text-primary">
					{entry} → {target}
				</span>
				<span className="text-[9px] text-muted-foreground">{target}</span>
			</div>
		</div>
	)
}

// ─── Skill chips row ────────────────────────────────────────────────

function SkillChips({ skills }: { skills: Skill[] }) {
	return (
		<div className="flex flex-wrap gap-1">
			{skills.map((skill) => {
				const Icon = SKILL_ICONS[skill]
				return (
					<div
						key={skill}
						className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5"
					>
						<Icon className={cn("size-3", SKILL_COLORS[skill])} />
						<span className="text-[10px] font-medium capitalize text-muted-foreground">
							{skill}
						</span>
					</div>
				)
			})}
		</div>
	)
}

// ─── ConfirmationStep ───────────────────────────────────────────────

export function ConfirmationStep({ data }: Props) {
	const examDate =
		data.examDate ??
		(() => {
			const d = new Date()
			d.setMonth(d.getMonth() + 6)
			return d
		})()
	const daysLeft = daysBetween(new Date(), examDate)

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="flex items-center justify-center gap-1.5">
				<Rocket className="size-3.5 text-primary" />
				<p className="text-xs font-bold text-foreground">Sẵn sàng cho hành trình!</p>
			</div>

			{/* Level track */}
			<div className="rounded-lg bg-muted/50 px-3 py-2">
				<LevelTrack entry={data.entryLevel} target={data.targetBand} />
			</div>

			{/* Info rows — vertical stack */}
			<div className="space-y-1.5">
				<ShadowRow
					accent="bg-blue-400"
					icon={Calendar}
					label={`Còn ${daysLeft} ngày`}
					value={formatDate(examDate)}
				/>
				<ShadowRow
					accent="bg-amber-400"
					icon={Target}
					label={data.weaknesses.length === 0 ? "Chưa chọn" : `${data.weaknesses.length} kỹ năng`}
					value={`${data.weaknesses.length} điểm yếu`}
				/>
				<ShadowRow
					accent="bg-violet-400"
					icon={Flag}
					label={data.motivation ? `@${data.motivation}` : "Tự do"}
					value={data.motivation ? MOTIVATION_META[data.motivation] : "Động lực"}
				/>
			</div>

			{/* Skill chips */}
			{data.weaknesses.length > 0 && (
				<div className="space-y-1">
					<p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
						Kỹ năng cần cải thiện
					</p>
					<SkillChips skills={data.weaknesses} />
				</div>
			)}
		</div>
	)
}
