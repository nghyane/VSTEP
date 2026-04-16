// LevelStep — chọn trình độ đầu vào (A1 → C1)
// Spec: vertical list rows với chú thích thực tế giúp người học tự định vị, selected = border-primary bg-primary/5

import { Check } from "lucide-react"
import type { Level } from "#/lib/onboarding/types"
import { cn } from "#/lib/utils"

interface Props {
	value: Level
	onChange: (level: Level) => void
}

const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"]

const LEVEL_META: Record<
	Level,
	{
		label: string
		emoji: string
		description: string
		evidence: string
		color: string
		bg: string
	}
> = {
	A1: {
		label: "A1",
		emoji: "🌱",
		description: "Sơ cấp A1",
		evidence: "Chào hỏi, hỏi tên cơ bản",
		color: "text-emerald-600",
		bg: "bg-emerald-100 text-emerald-700",
	},
	A2: {
		label: "A2",
		emoji: "📗",
		description: "Sơ cấp A2",
		evidence: "Mua sắm, hỏi giá, sinh hoạt đơn giản",
		color: "text-emerald-600",
		bg: "bg-emerald-100 text-emerald-700",
	},
	B1: {
		label: "B1",
		emoji: "📘",
		description: "Trung cấp B1",
		evidence: "Sở thích, du lịch, công việc quen thuộc",
		color: "text-blue-600",
		bg: "bg-blue-100 text-blue-700",
	},
	B2: {
		label: "B2",
		emoji: "🔥",
		description: "Trung cấp cao B2",
		evidence: "Tranh luận, thuyết trình, đọc báo khá",
		color: "text-violet-600",
		bg: "bg-violet-100 text-violet-700",
	},
	C1: {
		label: "C1",
		emoji: "💎",
		description: "Cao cấp C1",
		evidence: "Diễn đạt linh hoạt, hiểu phức tạp",
		color: "text-amber-600",
		bg: "bg-amber-100 text-amber-700",
	},
}

export function LevelStep({ value, onChange }: Props) {
	return (
		<div className="space-y-2.5">
			<p className="text-xs text-muted-foreground">
				Bạn tự đánh giá trình độ Tiếng Anh của mình ở mức nào?
			</p>

			<div className="space-y-1.5">
				{LEVELS.map((level) => {
					const meta = LEVEL_META[level]
					const isSelected = value === level
					return (
						<button
							key={level}
							type="button"
							onClick={() => onChange(level)}
							className={cn(
								"group flex w-full items-start gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
								isSelected
									? "border-primary bg-primary/5"
									: "border-border bg-background hover:border-primary/40",
							)}
						>
							{/* Emoji */}
							<span
								className={cn(
									"mt-0.5 flex size-7 shrink-0 items-center justify-center text-[18px] leading-none",
								)}
							>
								{meta.emoji}
							</span>

							{/* Text */}
							<div className="flex-1 min-w-0">
								<p className="truncate text-xs font-semibold text-foreground">{meta.description}</p>
								<p
									className={cn(
										"mt-0.5 truncate text-[11px] text-muted-foreground",
										isSelected && "text-primary/60",
									)}
								>
									{meta.evidence}
								</p>
							</div>

							{/* Check */}
							{isSelected && <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />}
						</button>
					)
				})}
			</div>

			<div className="flex items-center gap-1.5 rounded-lg border border-dashed border-orange-200 bg-orange-50 px-3 py-2">
				<span className="text-[11px] text-orange-600">💡</span>
				<p className="text-[11px] text-orange-700">
					Không chắc chắn? Chọn mức phù hợp nhất nhé — hệ thống sẽ điều chỉnh phù hợp.
				</p>
			</div>
		</div>
	)
}
