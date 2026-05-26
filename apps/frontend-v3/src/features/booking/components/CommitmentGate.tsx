import { Link } from "@tanstack/react-router"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { Icon } from "#/components/Icon"
import type { BookingCommitment, CommitmentPhase } from "#/features/booking/types"
import { cn, formatVnDate } from "#/lib/utils"

interface Props {
	commitment: BookingCommitment
}

export function CommitmentGate({ commitment }: Props) {
	if (commitment.phase === "met") return null

	const variant = VARIANTS[commitment.phase as keyof typeof VARIANTS]
	const progress = commitment.required > 0 ? (commitment.completed / commitment.required) * 100 : 0

	// Violated: chỉ notice gọn — thông tin chi tiết đã có ở trang khóa học.
	if (commitment.phase === "violated") {
		return (
			<div className="rounded-(--radius-card) bg-destructive/5 px-5 py-4">
				<p className="text-sm text-foreground leading-relaxed">
					<span className="font-bold text-destructive/80">Hết hạn cam kết.</span> Hạn cam kết đã qua (
					{commitment.deadline_at ? formatVnDate(commitment.deadline_at) : "—"}) nhưng bạn chỉ hoàn thành{" "}
					{commitment.completed}/{commitment.required} đề thi đầy đủ. Liên hệ trung tâm nếu muốn được hỗ trợ
					thêm.
				</p>
			</div>
		)
	}

	return (
		<section className="card p-5 space-y-4">
			<header className="flex items-center gap-3">
				<span
					className={cn(
						"inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
						variant.iconBg,
					)}
				>
					<Icon name={variant.icon} size="md" className={variant.iconFg} />
				</span>
				<div className="flex-1 min-w-0 space-y-1">
					<p className={cn("text-[11px] font-extrabold uppercase tracking-[0.18em]", variant.eyebrow)}>
						{variant.eyebrowText}
					</p>
					<h2 className="text-base font-extrabold text-foreground leading-snug">{variant.title}</h2>
				</div>
			</header>

			{commitment.required > 0 && (
				<div className="space-y-1.5">
					<div className="flex items-center justify-between gap-3 text-xs font-extrabold">
						<span className="text-muted">Tiến độ cam kết</span>
						<span className="inline-flex items-center gap-2">
							{commitment.deadline_at && (
								<>
									<span className="font-bold text-muted">
										Hạn{" "}
										<span className="tabular-nums text-foreground">
											{formatVnDate(commitment.deadline_at)}
										</span>
									</span>
									<span aria-hidden className="text-muted/40">
										·
									</span>
								</>
							)}
							<span className={variant.eyebrow}>
								<span className="tabular-nums">{commitment.completed}</span>
								<span className="text-muted/70"> / </span>
								<span className="tabular-nums">{commitment.required}</span> đề
							</span>
						</span>
					</div>
					<DuoProgressBar value={progress} tone={variant.bar} label="Tiến độ cam kết khóa học" />
				</div>
			)}

			{variant.cta && (
				<div className="flex justify-center pt-1">
					<Link to={variant.cta.to} className="btn btn-primary inline-flex text-sm py-2.5 px-6">
						<Icon name="play" size="xs" className="text-white" />
						{variant.cta.label}
					</Link>
				</div>
			)}
		</section>
	)
}

type ProgressTone = "primary" | "coin" | "warning" | "info" | "streak"

interface Variant {
	iconBg: string
	icon: "lightning" | "close" | "book"
	iconFg: string
	eyebrow: string
	eyebrowText: string
	title: string
	bar: ProgressTone
	cta: { to: "/thi-thu" | "/khoa-hoc"; label: string } | null
}

const VARIANTS: Record<Exclude<CommitmentPhase, "met" | "violated">, Variant> = {
	pending: {
		iconBg: "bg-coin/10",
		icon: "lightning",
		iconFg: "text-coin-dark",
		eyebrow: "text-coin-dark",
		eyebrowText: "Cam kết khóa học",
		title: "Hoàn thành đề thi đầy đủ để mở khóa đặt lịch 1-1",
		bar: "coin",
		cta: { to: "/thi-thu", label: "Vào thi thử ngay" },
	},
	not_enrolled: {
		iconBg: "bg-border-light",
		icon: "book",
		iconFg: "text-muted",
		eyebrow: "text-muted",
		eyebrowText: "Chưa ghi danh",
		title: "Bạn cần ghi danh khóa học trước",
		bar: "primary",
		cta: { to: "/khoa-hoc", label: "Tới danh sách khóa học" },
	},
}
