import { Link } from "@tanstack/react-router"
import { useEffect } from "react"
import { createPortal } from "react-dom"
import { StaticIcon } from "#/components/Icon"
import { COURSE_LEVEL_LABELS, type Course } from "#/features/course/types"
import { cn, formatNumber, formatVnd } from "#/lib/utils"

interface Props {
	open: boolean
	onClose: () => void
	courses: [Course, Course]
}

/**
 * Banner-style intro popup hiển thị 2 khóa học hot nhất khi user lần đầu vào trang
 * trong session. Tone gamification: gradient header, streak/coin tint cards,
 * uppercase eyebrow, border-b-4 Duo button.
 */
export function HotCoursesDialog({ open, onClose, courses }: Props) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose])

	if (!open || typeof document === "undefined") return null

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<button
				type="button"
				aria-label="Đóng"
				onClick={onClose}
				className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
			/>
			<div className="relative w-full max-w-3xl overflow-hidden rounded-(--radius-card) border-2 border-b-4 border-border bg-card shadow-[0_12px_28px_rgb(0_0_0_/_0.18)] animate-[popIn_0.22s_cubic-bezier(0.34,1.56,0.64,1)]">
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng"
					className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-surface/80 text-muted backdrop-blur transition-colors hover:bg-surface hover:text-foreground"
				>
					<svg
						viewBox="0 0 16 16"
						className="size-4"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M3 3l10 10M13 3L3 13" />
					</svg>
				</button>

				<div className="bg-gradient-to-b from-coin-tint/50 to-transparent px-6 pb-6 pt-8 text-center">
					<p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-warning">
						Khóa học hot tuần này
					</p>
					<h2 className="text-2xl font-extrabold text-foreground leading-tight">Đăng ký ngay kẻo lỡ!</h2>
					<p className="mt-1.5 text-sm text-muted">2 khóa được học viên đăng ký nhiều nhất nền tảng</p>
				</div>

				<div className="grid gap-4 p-6 sm:grid-cols-2 items-start">
					{courses.map((c, i) => (
						<HotCourseBanner key={c.id} course={c} rank={i + 1} onClick={onClose} />
					))}
				</div>

				<div className="px-6 pb-6 text-center">
					<button
						type="button"
						onClick={onClose}
						className="text-xs font-bold text-muted hover:text-foreground"
					>
						Xem tất cả khóa học →
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}

function HotCourseBanner({ course, rank, onClick }: { course: Course; rank: number; onClick: () => void }) {
	const orig = course.original_price_vnd
	const hasDiscount = orig !== null && orig > course.price_vnd
	const discountPct = hasDiscount ? Math.round((1 - course.price_vnd / orig) * 100) : 0
	const sold = course.sold_slots ?? 0
	const tone = rank === 1 ? "streak" : "coin"

	return (
		<Link
			to="/khoa-hoc/$courseId"
			params={{ courseId: course.id }}
			onClick={onClick}
			className={cn(
				"relative block overflow-hidden rounded-(--radius-card) border-2 border-b-4 transition-transform hover:-translate-y-0.5",
				tone === "streak" ? "border-streak/40" : "border-coin/40",
			)}
		>
			<div
				className={cn("flex flex-col gap-2 p-4", tone === "streak" ? "bg-streak-tint/50" : "bg-coin-tint/50")}
			>
				<div className="flex items-start justify-between gap-2">
					<span
						className={cn(
							"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider",
							tone === "streak" ? "bg-streak text-white" : "bg-coin text-coin-dark",
						)}
					>
						<StaticIcon name="streak-sm" size="xs" className="h-3.5 w-auto" />
						Hot #{rank}
					</span>
					{hasDiscount && (
						<span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-extrabold text-white">
							-{discountPct}%
						</span>
					)}
				</div>

				<span className="inline-flex w-fit items-center rounded-full border-2 border-border bg-surface px-2.5 py-0.5 text-xs font-bold text-foreground">
					{COURSE_LEVEL_LABELS[course.target_level] ?? course.target_level}
				</span>

				<p className="text-base font-extrabold leading-tight text-foreground line-clamp-2">{course.title}</p>

				<div className="flex items-center gap-1.5 text-sm">
					<StaticIcon name="streak-sm" size="xs" className="h-4 w-auto" />
					<span className="font-extrabold tabular-nums text-foreground">{formatNumber(sold)}</span>
					<span className="text-muted">học viên đã đăng ký</span>
				</div>

				<div className="flex items-baseline gap-2">
					{hasDiscount && orig !== null && (
						<span className="text-xs text-muted line-through tabular-nums">{formatVnd(orig)}</span>
					)}
					<span className="text-lg font-extrabold tabular-nums text-foreground">
						{formatVnd(course.price_vnd)}
					</span>
				</div>

				<span className="block w-full rounded-(--radius-button) bg-primary py-2.5 text-center text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_var(--color-primary-dark)] transition-all">
					Xem ngay →
				</span>
			</div>
		</Link>
	)
}
