import { Link } from "@tanstack/react-router"
import type { Course } from "#/features/course/types"

const LEVEL_LABELS: Record<string, string> = {
	B1: "VSTEP B1",
	B2: "VSTEP B2",
	C1: "VSTEP C1",
}

interface Props {
	course: Course
	enrolled: boolean
}

export function CourseCard({ course, enrolled }: Props) {
	const orig = course.original_price_vnd
	const hasDiscount = orig !== null && orig > course.price_vnd
	const discountPct = hasDiscount ? Math.round((1 - course.price_vnd / orig) * 100) : 0

	return (
		<Link
			to="/khoa-hoc/$courseId"
			params={{ courseId: course.id }}
			className="card-interactive p-6 flex flex-col gap-4 h-full"
		>
			<div className="flex items-center justify-between gap-2">
				<span className="text-xs font-bold px-2.5 py-0.5 rounded-full border-2 border-border bg-surface">
					{LEVEL_LABELS[course.target_level] ?? course.target_level}
				</span>
				{enrolled && (
					<span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-success/10 text-success">
						Đã mua
					</span>
				)}
			</div>

			<div>
				<p className="font-extrabold text-foreground">{course.title}</p>
				{course.target_exam_school && (
					<p className="text-xs text-muted mt-0.5">{course.target_exam_school}</p>
				)}
			</div>

			<div className="text-sm text-foreground">
				Khai giảng <span className="font-bold">{fmtDate(course.start_date)}</span>
			</div>

			<div className="flex-1" />

			<div className="border-t-2 border-border pt-4 flex items-end justify-between">
				<div>
					{hasDiscount && (
						<div className="flex items-center gap-2 mb-0.5">
							<span className="text-xs text-muted line-through tabular-nums">{fmtVnd(orig)}</span>
							<span className="text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
								-{discountPct}%
							</span>
						</div>
					)}
					<p className="text-lg font-extrabold text-foreground tabular-nums">{fmtVnd(course.price_vnd)}</p>
					{course.bonus_coins > 0 && (
						<p className="text-xs font-bold text-coin-dark mt-0.5">
							Tặng kèm {course.bonus_coins.toLocaleString("vi-VN")} xu
						</p>
					)}
				</div>
				<span className="text-xs font-bold text-primary">
					{enrolled ? "Vào khóa học →" : "Xem chi tiết →"}
				</span>
			</div>
		</Link>
	)
}

function fmtDate(iso: string): string {
	const d = new Date(iso)
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

function fmtVnd(n: number): string {
	return `${n.toLocaleString("vi-VN")}đ`
}
