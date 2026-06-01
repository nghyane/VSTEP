// CelebrationCard — result celebration card dùng chung cho 4 skills.
// RFC 0002: encouraging copy theo % range, GameIcon trophy, no emoji.

import { RotateCcw } from "lucide-react"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

interface Props {
	score: number
	total: number
	accentClass?: string
	onReset?: () => void
	backHref?: React.ReactNode
	children?: React.ReactNode
}

function getEncouragement(pct: number): { text: string; icon: string } {
	if (pct >= 90) return { text: "Xuất sắc! Tiếp tục phát huy nhé", icon: "trophy" }
	if (pct >= 70) return { text: "Khá ổn rồi, luyện thêm một chút nữa.", icon: "star" }
	if (pct >= 50) return { text: "Cần cải thiện. Xem lại lỗi để học sâu hơn.", icon: "target" }
	return { text: "Bài này khó, đừng nản. Hãy ôn lại kiến thức nền.", icon: "rocket" }
}

export function CelebrationCard({
	score,
	total,
	accentClass = "border-b-primary/50",
	onReset,
	backHref,
	children,
}: Props) {
	const pct = total > 0 ? Math.round((score / total) * 100) : 0
	const { text, icon } = getEncouragement(pct)

	return (
		<div
			className={cn(
				"flex flex-col items-center gap-4 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 bg-card p-8 text-center",
				accentClass,
			)}
		>
			<img
				src={`/icons/${icon}.png`}
				alt=""
				aria-hidden="true"
				className="size-20 shrink-0 object-contain"
			/>
			<div className="text-5xl font-bold tabular-nums text-primary">{pct}%</div>
			<p className="text-lg font-bold">
				Bạn trả lời đúng {score}/{total} câu
			</p>
			<p className="max-w-md text-sm text-muted-foreground">{text}</p>
			<div className="w-full max-w-xs">
				<div className="h-3 overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-border/30">
					<div
						className={cn(
							"h-full rounded-full transition-all shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]",
							pct >= 80 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-warning",
						)}
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>
			{children}
			<div className="flex items-center gap-3 pt-2">
				{onReset && (
					<Button type="button" variant="outline" onClick={onReset}>
						<RotateCcw className="size-4" /> Làm lại
					</Button>
				)}
				{backHref}
			</div>
		</div>
	)
}
