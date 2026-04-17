// Dialog mua khóa học bằng tiền thật (VND). Mock payment — BE sẽ xử lý sau.
// Sau khi thanh toán thành công: lưu enrollment + cộng xu bonus tặng kèm.

import { useQueryClient } from "@tanstack/react-query"
import { Building2, QrCode, Wallet } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { CoinIcon } from "#/components/common/CoinIcon"
import { Button } from "#/components/ui/button"
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
import { cn } from "#/lib/utils"
import { formatCoins, formatVnd } from "./course-utils"

interface Props {
	course: Course
	open: boolean
	onOpenChange: (open: boolean) => void
}

type PaymentMethod = "qr" | "banking" | "momo"

const PAYMENT_METHODS: readonly {
	id: PaymentMethod
	label: string
	sublabel: string
	icon: React.ComponentType<{ className?: string }>
}[] = [
	{ id: "qr", label: "VietQR", sublabel: "Quét mã bằng app ngân hàng", icon: QrCode },
	{ id: "banking", label: "Chuyển khoản", sublabel: "Qua Internet Banking", icon: Building2 },
	{ id: "momo", label: "Ví MoMo", sublabel: "Thanh toán qua MoMo", icon: Wallet },
]

export function CoursePurchaseDialog({ course, open, onOpenChange }: Props) {
	const queryClient = useQueryClient()
	const [method, setMethod] = useState<PaymentMethod>("qr")
	const [processing, setProcessing] = useState(false)

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
			onOpenChange(false)
		}, 600)
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !processing && onOpenChange(v)}>
			<DialogContent className="sm:max-w-md">
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
								<span className="text-xs leading-none text-muted-foreground line-through tabular-nums">
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

				{/* Payment methods */}
				<div className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Phương thức thanh toán
					</p>
					<div className="grid gap-2">
						{PAYMENT_METHODS.map((m) => (
							<MethodRow
								key={m.id}
								method={m}
								selected={method === m.id}
								onSelect={() => setMethod(m.id)}
							/>
						))}
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
						Hủy
					</Button>
					<Button onClick={handleConfirm} disabled={processing}>
						{processing ? "Đang xử lý…" : `Thanh toán ${formatVnd(course.priceVnd)}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function MethodRow({
	method,
	selected,
	onSelect,
}: {
	method: {
		id: PaymentMethod
		label: string
		sublabel: string
		icon: React.ComponentType<{ className?: string }>
	}
	selected: boolean
	onSelect: () => void
}) {
	const Icon = method.icon
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={cn(
				"flex items-center gap-3 rounded-xl border-2 bg-card p-3 text-left transition-all",
				selected
					? "border-primary shadow-sm ring-4 ring-primary/10"
					: "border-border hover:border-foreground/20",
			)}
		>
			<span
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-lg",
					selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
				)}
			>
				<Icon className="size-4" />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-foreground">{method.label}</p>
				<p className="text-[11px] text-muted-foreground">{method.sublabel}</p>
			</div>
			<span
				className={cn(
					"size-4 shrink-0 rounded-full border-2",
					selected ? "border-primary bg-primary" : "border-border",
				)}
				aria-hidden
			>
				{selected && (
					<span className="block size-full rounded-full border-[3px] border-background" />
				)}
			</span>
		</button>
	)
}
