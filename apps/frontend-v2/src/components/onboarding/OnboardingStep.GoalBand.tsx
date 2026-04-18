// GoalBandStep — chọn band đích (B1, B2, C1)
// Spec: gamified 3 cards, selected = border-primary bg-primary/5 + checkmark badge

import { Check, Target } from "lucide-react"
import type { Level } from "#/lib/onboarding/types"
import { cn } from "#/shared/lib/utils"

interface Props {
	value: Level
	entryLevel: Level
	onChange: (targetBand: Level) => void
}

const LEVEL_ORDER: Record<Level, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 }

const BANDS: {
	key: Level
	label: string
	sub: string
	color: string
}[] = [
	{
		key: "B1",
		label: "B1",
		sub: "Phổ biến, yêu cầu tuyển dụng cơ bản",
		color: "text-blue-500",
	},
	{
		key: "B2",
		label: "B2",
		sub: "Công việc & du học phổ biến nhất",
		color: "text-violet-500",
	},
	{
		key: "C1",
		label: "C1",
		sub: "Trình độ cao, mục tiêu khắt khe",
		color: "text-amber-500",
	},
]

export function GoalBandStep({ value, onChange, entryLevel }: Props) {
	const entryNum = LEVEL_ORDER[entryLevel]

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<p className="text-xs font-semibold text-foreground">Mục tiêu band điểm</p>
				<p className="text-[11px] text-muted-foreground">
					Mục tiêu cần cao hơn trình độ đầu vào của bạn
				</p>
			</div>

			<div className="space-y-2">
				{BANDS.map((band) => {
					const isSelected = value === band.key
					const isDisabled = LEVEL_ORDER[band.key] <= entryNum

					return (
						<button
							key={band.key}
							type="button"
							onClick={() => !isDisabled && onChange(band.key)}
							disabled={isDisabled}
							className={cn(
								"group relative flex w-full items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-all",
								isDisabled && "cursor-not-allowed opacity-40",
								isSelected
									? "border-primary bg-primary/5"
									: !isDisabled && "border-border bg-background hover:border-primary/30",
								!isSelected && !isDisabled && "border-border bg-background",
							)}
						>
							{/* Icon */}
							<div
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-lg",
									isSelected ? `${band.color} bg-current/10` : "bg-muted text-muted-foreground",
								)}
							>
								<Target className={cn("size-4", isSelected ? band.color : "")} />
							</div>

							{/* Text */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span
										className={cn("text-sm font-bold", isSelected ? band.color : "text-foreground")}
									>
										{band.label}
									</span>
									{isDisabled && (
										<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
											Thấp hơn hiện tại
										</span>
									)}
								</div>
								<p className="mt-0.5 truncate text-[11px] text-muted-foreground">{band.sub}</p>
							</div>

							{/* Checkmark badge */}
							{isSelected && (
								<div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
									<Check className="size-3 text-primary-foreground" />
								</div>
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}
