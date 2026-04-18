// MotivationStep — chọn điểm yếu + động lực (step 5/5, gamified)
// Spec: weaknesses multi-select 4 skills + motivation single-select, selected = border-primary bg-primary/5

import {
	BookOpen,
	Briefcase,
	Check,
	Dumbbell,
	Globe,
	GraduationCap,
	Headphones,
	Mic,
	PencilLine,
} from "lucide-react"
import type { Motivation, OnboardingData, Skill } from "#/lib/onboarding/types"
import { cn } from "#/shared/lib/utils"

interface Props {
	data: Pick<OnboardingData, "weaknesses" | "motivation">
	onChange: (data: Partial<Pick<OnboardingData, "weaknesses" | "motivation">>) => void
}

const SKILLS: {
	key: Skill
	label: string
	Icon: React.ComponentType<{ className?: string }>
	color: string
}[] = [
	{ key: "listening", label: "Listening", Icon: Headphones, color: "text-skill-listening" },
	{ key: "reading", label: "Reading", Icon: BookOpen, color: "text-skill-reading" },
	{ key: "writing", label: "Writing", Icon: PencilLine, color: "text-skill-writing" },
	{ key: "speaking", label: "Speaking", Icon: Mic, color: "text-skill-speaking" },
]

const MOTIVATIONS: {
	key: Motivation
	label: string
	description: string
	Icon: React.ComponentType<{ className?: string }>
}[] = [
	{
		key: "graduation",
		label: "Thi tốt nghiệp",
		description: "Chuẩn đầu ra bắt buộc",
		Icon: GraduationCap,
	},
	{
		key: "job_requirement",
		label: "Công việc",
		description: "CV & thăng tiến",
		Icon: Briefcase,
	},
	{
		key: "scholarship",
		label: "Học bổng",
		description: "Du học & phát triển",
		Icon: Globe,
	},
	{
		key: "personal",
		label: "Bản thân",
		description: "Tự tin giao tiếp",
		Icon: Dumbbell,
	},
]

export function MotivationStep({ data, onChange }: Props) {
	function toggleSkill(skill: Skill) {
		const current = data.weaknesses
		const next = current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill]
		onChange({ weaknesses: next })
	}

	function selectMotivation(motivation: Motivation) {
		onChange({ motivation })
	}

	return (
		<div className="space-y-5">
			{/* Weaknesses */}
			<div className="space-y-2.5">
				<div>
					<p className="text-xs font-semibold text-foreground">
						Kỹ năng nào đang là "gót chân Achilles" của bạn?
					</p>
					<p className="mt-0.5 text-[11px] text-muted-foreground">Có thể chọn nhiều</p>
				</div>

				<div className="grid grid-cols-4 gap-2">
					{SKILLS.map(({ key, label, Icon, color }) => {
						const selected = data.weaknesses.includes(key)
						return (
							<button
								key={key}
								type="button"
								onClick={() => toggleSkill(key)}
								className={cn(
									"relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all",
									selected
										? "border-primary bg-primary/5"
										: "border-border bg-background hover:border-primary/30",
								)}
							>
								<Icon className={cn("size-5", selected ? color : "text-muted-foreground")} />
								<span
									className={cn(
										"text-[10px] font-semibold",
										selected ? color : "text-muted-foreground",
									)}
								>
									{label}
								</span>
								{selected && (
									<div className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
										<Check className="size-2.5 text-primary-foreground" />
									</div>
								)}
							</button>
						)
					})}
				</div>
			</div>

			{/* Motivation */}
			<div className="space-y-2.5">
				<div>
					<p className="text-xs font-semibold text-foreground">
						Lý do bạn chinh phục VSTEP lần này là gì?
					</p>
				</div>

				<div className="grid grid-cols-2 gap-2">
					{MOTIVATIONS.map(({ key, label, description, Icon }) => {
						const selected = data.motivation === key
						return (
							<button
								key={key}
								type="button"
								onClick={() => selectMotivation(key)}
								className={cn(
									"relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
									selected
										? "border-primary bg-primary/5"
										: "border-border bg-background hover:border-primary/30",
								)}
							>
								<Icon
									className={cn("size-5", selected ? "text-primary" : "text-muted-foreground")}
								/>
								<p
									className={cn(
										"mt-1 text-xs font-bold",
										selected ? "text-primary" : "text-foreground",
									)}
								>
									{label}
								</p>
								<p className="text-[10px] text-muted-foreground">{description}</p>
								{selected && (
									<div className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
										<Check className="size-2.5 text-primary-foreground" />
									</div>
								)}
							</button>
						)
					})}
				</div>
			</div>
		</div>
	)
}
