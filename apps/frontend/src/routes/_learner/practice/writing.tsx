import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Mail01Icon,
	Note01Icon,
	PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useProgress } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import { skillColor } from "@/routes/_learner/exams/-components/skill-meta"
import type { WritingTier } from "@/types/api"

export const Route = createFileRoute("/_learner/practice/writing")({
	component: WritingPracticePage,
})

// ═══════════════════════════════════════════════════
// Tier helpers
// ═══════════════════════════════════════════════════

function tierFromScaffold(scaffoldLevel: number): WritingTier {
	if (scaffoldLevel <= 0) return 1
	if (scaffoldLevel === 1) return 2
	return 3
}

const TIER_META: Record<WritingTier, { label: string; description: string; color: string }> = {
	1: {
		label: "Cấp 1 — Trợ nhiệt tình",
		description: "Bài viết có khung mẫu sẵn, bạn chỉ cần điền vào chỗ trống",
		color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	2: {
		label: "Cấp 2 — Gợi ý khung",
		description: "Tự viết bài với gợi ý dàn bài và mẫu câu",
		color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	3: {
		label: "Cấp 3 — Thực chiến",
		description: "Tự viết bài hoàn toàn, không có hỗ trợ",
		color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	},
}

const PART_CARDS = [
	{
		part: 1,
		title: "Viết thư",
		description: "Viết thư cá nhân hoặc bán trang trọng, tối thiểu 120 từ",
		icon: Mail01Icon,
		accent: "border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600",
	},
	{
		part: 2,
		title: "Bài luận",
		description: "Viết bài luận nghị luận hoặc phân tích, tối thiểu 250 từ",
		icon: Note01Icon,
		accent:
			"border-purple-200 hover:border-purple-400 dark:border-purple-800 dark:hover:border-purple-600",
	},
] as const

// ═══════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════

function WritingPracticePage() {
	const { data: progress, isLoading } = useProgress()

	const writingProgress = progress?.skills.find((s) => s.skill === "writing")
	const tier = writingProgress ? tierFromScaffold(writingProgress.scaffoldLevel) : null
	const level = writingProgress?.currentLevel ?? null
	const attemptCount = writingProgress?.attemptCount ?? 0

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Header />
				<Skeleton className="h-24 rounded-2xl" />
				<div className="grid gap-4 sm:grid-cols-2">
					<Skeleton className="h-40 rounded-2xl" />
					<Skeleton className="h-40 rounded-2xl" />
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<Header />

			{/* Tier + Level info */}
			{tier && (
				<div className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-5">
					<div
						className={cn(
							"flex size-11 items-center justify-center rounded-xl",
							skillColor.writing,
						)}
					>
						<HugeiconsIcon icon={PencilEdit02Icon} className="size-5" />
					</div>
					<div className="flex-1 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary" className={TIER_META[tier].color}>
								{TIER_META[tier].label}
							</Badge>
							{level && (
								<span className="text-sm font-semibold text-muted-foreground">Level {level}</span>
							)}
						</div>
						<p className="text-sm text-muted-foreground">{TIER_META[tier].description}</p>
					</div>
					<div className="text-right">
						<p className="text-2xl font-bold">{attemptCount}</p>
						<p className="text-xs text-muted-foreground">bài đã làm</p>
					</div>
				</div>
			)}

			{/* Part selection cards */}
			<div>
				<p className="mb-3 text-sm font-semibold text-muted-foreground">Chọn dạng bài</p>
				<div className="grid gap-4 sm:grid-cols-2">
					{PART_CARDS.map((card) => (
						<Link
							key={card.part}
							to="/exercise"
							search={{ skill: "writing", id: "", part: String(card.part), session: "" }}
							className={cn(
								"group flex flex-col justify-between rounded-2xl border-2 p-6 transition-all",
								card.accent,
							)}
						>
							<div className="space-y-3">
								<div className="flex items-center gap-3">
									<div
										className={cn(
											"flex size-10 items-center justify-center rounded-xl",
											skillColor.writing,
										)}
									>
										<HugeiconsIcon icon={card.icon} className="size-5" />
									</div>
									<div>
										<h3 className="text-base font-bold">{card.title}</h3>
										<span className="text-xs text-muted-foreground">Part {card.part}</span>
									</div>
								</div>
								<p className="text-sm text-muted-foreground">{card.description}</p>
							</div>
							<div className="mt-4 flex items-center justify-end gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
								Bắt đầu
								<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
							</div>
						</Link>
					))}
				</div>
			</div>

			{/* Adaptive explanation */}
			<div className="rounded-xl border border-dashed border-muted-foreground/20 p-4">
				<p className="text-xs text-muted-foreground leading-relaxed">
					Hệ thống sẽ tự chọn đề phù hợp trình độ và cấp hỗ trợ của bạn. Khi bạn làm tốt liên tiếp,
					cấp hỗ trợ sẽ giảm dần để bạn tự lực hơn.
				</p>
			</div>
		</div>
	)
}

function Header() {
	return (
		<div className="flex items-center gap-3">
			<Button variant="ghost" size="icon" className="size-8" asChild>
				<Link to="/practice">
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
				</Link>
			</Button>
			<div
				className={cn("flex size-10 items-center justify-center rounded-xl", skillColor.writing)}
			>
				<HugeiconsIcon icon={PencilEdit02Icon} className="size-5" />
			</div>
			<div>
				<h1 className="text-xl font-bold">Luyện viết</h1>
				<p className="text-sm text-muted-foreground">Chọn dạng bài để bắt đầu luyện tập</p>
			</div>
		</div>
	)
}
