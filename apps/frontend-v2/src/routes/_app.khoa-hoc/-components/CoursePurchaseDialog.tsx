// Dialog mua khóa học bằng tiền thật (VND). Mock payment — BE sẽ xử lý sau.
// Sau khi thanh toán thành công: lưu enrollment + cộng xu bonus tặng kèm.

import { useQueryClient } from "@tanstack/react-query"
import { ShieldAlert } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { CoinIcon } from "#/components/common/CoinIcon"
import { Button } from "#/components/ui/button"
import { Checkbox } from "#/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog"
import { enrollInCourse } from "#/lib/courses/enrollment-store"
import { type Course, discountPercent, hasDiscount, savedVnd } from "#/lib/mock/courses"
import { pushNotification } from "#/lib/notifications/store"
import { courseKeys } from "#/lib/queries/courses"
import { formatCoins, formatVnd } from "./course-utils"

interface Props {
	course: Course
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function CoursePurchaseDialog({ course, open, onOpenChange }: Props) {
	const queryClient = useQueryClient()
	const [processing, setProcessing] = useState(false)
	const [acknowledged, setAcknowledged] = useState(false)

	function handleConfirm() {
		// Mock payment — giả lập call API 600ms rồi success.
		setProcessing(true)
		window.setTimeout(() => {
			enrollInCourse(course)
			queryClient.invalidateQueries({ queryKey: courseKeys.detail(course.id) })
			toast.success(`Đã đăng ký ${course.title}`, {
				description:
					course.bonusCoins > 0
						? `Đã thanh toán ${formatVnd(course.priceVnd)} · Nhận ${formatCoins(course.bonusCoins)} xu tặng kèm.`
						: `Đã thanh toán ${formatVnd(course.priceVnd)}.`,
			})
			pushNotification({
				id: `course:enrolled:${course.id}:${Date.now()}`,
				title: `Đã đăng ký ${course.title}`,
				body:
					course.bonusCoins > 0
						? `+${formatCoins(course.bonusCoins)} xu tặng kèm đã cộng vào tài khoản.`
						: `Kiểm tra lịch buổi học trong "Khóa của tôi".`,
				iconKey: "coin",
			})
			setProcessing(false)
			setAcknowledged(false)
			onOpenChange(false)
		}, 600)
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !processing && onOpenChange(v)}>
			<DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Đăng ký khóa học</DialogTitle>
					<DialogDescription>
						Thanh toán một lần cho toàn khóa. Khóa học có hiệu lực đến hết ngày kết thúc.
					</DialogDescription>
				</DialogHeader>

				{/* Course summary */}
				<div className="space-y-3 rounded-xl bg-muted/50 p-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Khóa học
						</p>
						<p className="mt-0.5 font-semibold text-foreground">{course.title}</p>
					</div>

					<div className="h-px w-full bg-border" />

					{hasDiscount(course) && (
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-foreground">Giá niêm yết</span>
							<span className="flex items-center gap-2">
								<span className="relative inline-block text-base leading-none text-muted-foreground tabular-nums before:absolute before:inset-x-0 before:top-[45%] before:h-px before:-translate-y-1/2 before:bg-current before:content-['']">
									{formatVnd(course.originalPriceVnd)}
								</span>
								<span className="inline-flex items-center rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-bold text-destructive tabular-nums">
									-{discountPercent(course)}%
								</span>
							</span>
						</div>
					)}

					<div className="flex items-baseline justify-between">
						<span className="text-sm text-muted-foreground">Tổng thanh toán</span>
						<span className="text-xl font-extrabold text-foreground tabular-nums">
							{formatVnd(course.priceVnd)}
						</span>
					</div>

					{hasDiscount(course) && (
						<div className="flex items-baseline justify-between rounded-lg bg-emerald-100 px-3 py-2 dark:bg-emerald-950/40">
							<span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
								Bạn tiết kiệm
							</span>
							<span className="text-xs font-bold text-emerald-800 tabular-nums dark:text-emerald-300">
								{formatVnd(savedVnd(course))}
							</span>
						</div>
					)}

					{course.bonusCoins > 0 && (
						<div className="flex items-center justify-between rounded-lg bg-amber-100 px-3 py-2 dark:bg-amber-950/40">
							<span className="text-xs font-medium text-amber-800 dark:text-amber-300">
								Xu tặng kèm
							</span>
							<span className="flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300">
								<span className="flex size-4 items-center justify-center">
									<CoinIcon size={14} className="-translate-y-px" />
								</span>
								<span className="translate-y-[0.5px] leading-none tabular-nums">
									+{formatCoins(course.bonusCoins)} xu
								</span>
							</span>
						</div>
					)}
				</div>

				{/* Commitment notice */}
				<div className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
					<div className="flex items-start gap-2">
						<ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
						<div className="min-w-0 flex-1 space-y-1.5">
							<p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
								Cam kết kỷ luật
							</p>
							<p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
								Để giữ cam kết đầu ra, bạn cần hoàn thành tối thiểu{" "}
								<strong>{course.requiredFullTests} bài thi full-test</strong> trong phòng thi từ
								ngày thứ <strong>{course.practicePhaseDays + 1}</strong> đến ngày thứ{" "}
								<strong>{course.examPhaseDays}</strong> của khóa. Vi phạm sẽ dẫn tới việc{" "}
								<strong>khóa quyền truy cập khóa học</strong>.
							</p>
							<label
								htmlFor="course-commitment-ack"
								className="flex cursor-pointer items-center gap-2 pt-1"
							>
								<Checkbox
									id="course-commitment-ack"
									checked={acknowledged}
									onCheckedChange={(v) => setAcknowledged(v === true)}
									disabled={processing}
								/>
								<span className="text-xs font-medium leading-none text-amber-900 dark:text-amber-200">
									Tôi đã đọc và đồng ý với điều khoản kỷ luật của khóa học.
								</span>
							</label>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
						Hủy
					</Button>
					<Button onClick={handleConfirm} disabled={processing || !acknowledged}>
						{processing ? "Đang xử lý…" : `Thanh toán ${formatVnd(course.priceVnd)}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
