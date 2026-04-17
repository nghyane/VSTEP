// Card khóa học ở tab "Khám phá". 3 state: còn chỗ / hết chỗ / đã mua.
// Rule 0.2: rounded-2xl border bg-card p-6 shadow-sm.
// Rule 0.3: hover chỉ nâng nhẹ, không đổi border.

import { Link } from "@tanstack/react-router"
import { ArrowRight, CalendarDays, GraduationCap, Users } from "lucide-react"
import { CoinIcon } from "#/components/common/CoinIcon"
import {
	COURSE_LEVEL_LABELS,
	type Course,
	discountPercent,
	hasDiscount,
	isCourseFull,
	remainingSlots,
} from "#/lib/mock/courses"
import { cn } from "#/lib/utils"
import { formatCoins, formatDateVi, formatVnd } from "./course-utils"

interface Props {
	course: Course
	enrolled: boolean
}

export function CourseCard({ course, enrolled }: Props) {
	const full = isCourseFull(course)
	const left = remainingSlots(course)

	// Badge top-right state
	const slotBadge = enrolled ? (
		<Badge tone="success">Đã mua</Badge>
	) : full ? (
		<Badge tone="muted">Đã đầy</Badge>
	) : left <= 5 ? (
		<Badge tone="amber">Còn {left} chỗ</Badge>
	) : (
		<Badge tone="info">Còn {left} chỗ</Badge>
	)

	const ctaDisabled = full && !enrolled

	return (
		<div
			className={cn(
				"group relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all",
				!ctaDisabled && "hover:-translate-y-0.5 hover:shadow-md",
				ctaDisabled && "opacity-75",
			)}
		>
			{/* Top row: level + slot state */}
			<div className="flex items-center justify-between gap-2">
				<Badge tone="outline">{COURSE_LEVEL_LABELS[course.level]}</Badge>
				{slotBadge}
			</div>

			{/* Title + target exam */}
			<div className="space-y-1">
				<h3 className="text-lg font-bold leading-tight text-foreground">{course.title}</h3>
				<p className="text-xs text-muted-foreground">{course.targetExam}</p>
			</div>

			{/* Highlights bullets */}
			<ul className="space-y-1.5 text-sm text-foreground">
				<li className="flex items-start gap-2">
					<CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<span>
						Khai giảng <span className="font-medium">{formatDateVi(course.startDate)}</span> ·{" "}
						{course.sessions.length} buổi
					</span>
				</li>
				<li className="flex items-start gap-2">
					<GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<span>
						Giáo viên: <span className="font-medium">{course.instructor.name}</span>
					</span>
				</li>
				<li className="flex items-start gap-2">
					<Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<span>
						<span className="tabular-nums">{course.soldSlots}</span>/{course.maxSlots} học viên
					</span>
				</li>
			</ul>

			{/* Divider */}
			<div className="flex-1" />
			<div className="h-px w-full bg-border" />

			{/* Price + CTA */}
			<div className="flex items-end justify-between gap-3">
				<div className="min-w-0 flex-1 space-y-1.5">
					{hasDiscount(course) && (
						<div className="flex items-center gap-2">
							<span className="text-xs leading-none text-muted-foreground line-through tabular-nums">
								{formatVnd(course.originalPriceVnd)}
							</span>
							<span className="inline-flex items-center rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive tabular-nums">
								-{discountPercent(course)}%
							</span>
						</div>
					)}
					<p className="text-lg font-extrabold leading-none text-foreground tabular-nums">
						{formatVnd(course.priceVnd)}
					</p>
					{course.bonusCoins > 0 && (
						<span className="inline-flex h-5 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
							<span className="flex size-3.5 items-center justify-center">
								<CoinIcon size={12} className="-translate-y-px" />
							</span>
							<span className="translate-y-[0.5px] leading-none tabular-nums">
								Tặng {formatCoins(course.bonusCoins)} xu
							</span>
						</span>
					)}
				</div>

				{enrolled ? (
					<Link
						to="/khoa-hoc/$courseId"
						params={{ courseId: course.id }}
						className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
					>
						Vào khóa học
						<ArrowRight className="size-3.5" />
					</Link>
				) : ctaDisabled ? (
					<span className="text-xs font-medium text-muted-foreground">Chọn khóa khác</span>
				) : (
					<Link
						to="/khoa-hoc/$courseId"
						params={{ courseId: course.id }}
						className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline"
					>
						Xem chi tiết
						<ArrowRight className="size-3.5" />
					</Link>
				)}
			</div>

			{/* Full-card overlay link (chỉ khi không full) */}
			{!ctaDisabled && (
				<Link
					to="/khoa-hoc/$courseId"
					params={{ courseId: course.id }}
					className="absolute inset-0 rounded-2xl"
					aria-label={`Xem chi tiết ${course.title}`}
				/>
			)}
		</div>
	)
}

// ─── Badge (local) ────────────────────────────────────────────────────────────

type BadgeTone = "outline" | "info" | "amber" | "muted" | "success"

function Badge({ children, tone }: { children: React.ReactNode; tone: BadgeTone }) {
	const toneClass: Record<BadgeTone, string> = {
		outline: "border border-border bg-background text-foreground",
		info: "bg-primary/10 text-primary",
		amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
		muted: "bg-muted text-muted-foreground",
		success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
	}
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
				toneClass[tone],
			)}
		>
			{children}
		</span>
	)
}
