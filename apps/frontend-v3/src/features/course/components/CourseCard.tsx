import { Link } from "@tanstack/react-router"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { StaticIcon } from "#/components/Icon"
import { COURSE_LEVEL_LABELS, type Course } from "#/features/course/types"
import { cn, formatDate, formatNumber, formatVnd } from "#/lib/utils"

interface Props {
	course: Course
	enrolled: boolean
}

export function CourseCard({ course, enrolled }: Props) {
	const sold = course.sold_slots
	const remaining = sold !== undefined ? Math.max(0, course.max_slots - sold) : null
	const full = remaining === 0
	const ctaDisabled = full && !enrolled

	const cta = enrolled ? "Vào khóa học →" : ctaDisabled ? "Chọn khóa khác" : "Xem chi tiết →"

	const card = (
		<div className={cn("p-6 flex flex-col gap-4", ctaDisabled ? "card opacity-75" : "card-interactive")}>
			<div className="flex items-center justify-between gap-2">
				<span className="inline-flex items-center rounded-full border-2 border-border bg-surface px-2.5 py-0.5 text-xs font-bold text-foreground">
					{COURSE_LEVEL_LABELS[course.target_level] ?? course.target_level}
				</span>
				<SlotBadge enrolled={enrolled} full={full} remaining={remaining} />
			</div>

			<div>
				<p className="text-base font-extrabold leading-tight text-foreground">{course.title}</p>
				{course.target_exam_school && <p className="text-xs text-muted mt-1">{course.target_exam_school}</p>}
			</div>

			<MetaRows course={course} sold={sold} />

			<div className="border-t-2 border-border pt-4 flex items-center justify-between gap-3">
				<PriceBlock course={course} />
				<span
					className={cn("text-xs font-bold whitespace-nowrap", ctaDisabled ? "text-muted" : "text-primary")}
				>
					{cta}
				</span>
			</div>
		</div>
	)

	if (ctaDisabled) return card

	return (
		<Link to="/khoa-hoc/$courseId" params={{ courseId: course.id }} className="block">
			{card}
		</Link>
	)
}

function MetaRows({ course, sold }: { course: Course; sold: number | undefined }) {
	const sessions = course.schedule_items_count
	return (
		<ul className="space-y-1.5 text-sm text-foreground">
			<li>
				Khai giảng <span className="font-bold tabular-nums">{formatDate(course.start_date)}</span>
				{sessions !== undefined && <span className="text-muted"> · {sessions} buổi</span>}
			</li>
			{course.teacher && (
				<li>
					Giáo viên: <span className="font-bold">{course.teacher.full_name}</span>
				</li>
			)}
			{sold !== undefined && (
				<li className="space-y-1.5 pt-0.5">
					<div className="flex items-baseline justify-between">
						<span>
							<span className="tabular-nums font-bold">{sold}</span>
							<span className="font-bold">/{course.max_slots}</span>
							<span className="text-muted"> học viên</span>
						</span>
						<SlotProgressLabel sold={sold} max={course.max_slots} />
					</div>
					<DuoProgressBar
						value={slotFillRatio(sold, course.max_slots)}
						tone={slotFillTone(sold, course.max_slots) === "low" ? "primary" : "warning"}
						heightPx={8}
						label="Tỉ lệ ghế đã đăng ký"
					/>
				</li>
			)}
		</ul>
	)
}

function slotFillRatio(sold: number, max: number): number {
	if (max <= 0) return 0
	return Math.min(100, Math.round((sold / max) * 100))
}

function slotFillTone(sold: number, max: number): "full" | "high" | "low" {
	const remaining = max - sold
	if (remaining <= 0) return "full"
	if (remaining <= 5) return "high"
	return "low"
}

function SlotProgressLabel({ sold, max }: { sold: number; max: number }) {
	const tone = slotFillTone(sold, max)
	if (tone === "full") return <span className="text-xs font-bold text-subtle">Hết chỗ</span>
	if (tone === "high") return <span className="text-xs font-bold text-warning">Sắp đầy</span>
	const pct = slotFillRatio(sold, max)
	return <span className="text-xs font-bold text-muted tabular-nums">{pct}% đầy</span>
}

function PriceBlock({ course }: { course: Course }) {
	const orig = course.original_price_vnd
	const hasDiscount = orig !== null && orig > course.price_vnd
	const discountPct = hasDiscount ? Math.round((1 - course.price_vnd / orig) * 100) : 0
	return (
		<div>
			{hasDiscount && (
				<div className="flex items-center gap-2 mb-1">
					<span className="text-xs text-muted line-through tabular-nums">{formatVnd(orig)}</span>
					<span className="text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
						-{discountPct}%
					</span>
				</div>
			)}
			<p className="text-lg font-extrabold text-foreground tabular-nums leading-none">
				{formatVnd(course.price_vnd)}
			</p>
			{course.bonus_coins > 0 && (
				<span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-coin-tint px-2 py-0.5 text-xs font-bold text-coin-dark">
					<StaticIcon name="coin" size="xs" className="h-3.5 w-auto" />
					Tặng {formatNumber(course.bonus_coins)} xu
				</span>
			)}
		</div>
	)
}

type BadgeTone = "info" | "warning" | "muted" | "success"

const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
	info: "bg-primary/10 text-primary",
	warning: "bg-warning/10 text-warning",
	muted: "bg-border text-muted",
	success: "bg-success/10 text-success",
}

function SlotBadge({
	enrolled,
	full,
	remaining,
}: {
	enrolled: boolean
	full: boolean
	remaining: number | null
}) {
	if (enrolled) return <Badge tone="success">Đã mua</Badge>
	if (full) return <Badge tone="muted">Đã đầy</Badge>
	if (remaining === null) return null
	if (remaining <= 5) return <Badge tone="warning">Còn {remaining} chỗ</Badge>
	return <Badge tone="info">Còn {remaining} chỗ</Badge>
}

function Badge({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
				BADGE_TONE_CLASS[tone],
			)}
		>
			{children}
		</span>
	)
}
