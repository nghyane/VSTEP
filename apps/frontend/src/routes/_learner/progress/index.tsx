import {
	Book02Icon,
	Clock01Icon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
	Target02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useProgress, useSpiderChart } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import type { Skill, Trend } from "@/types/api"

export const Route = createFileRoute("/_learner/progress/")({
	component: ProgressOverviewPage,
})

const SKILLS: { key: Skill; label: string; icon: IconSvgElement }[] = [
	{ key: "listening", label: "Listening", icon: HeadphonesIcon },
	{ key: "reading", label: "Reading", icon: Book02Icon },
	{ key: "writing", label: "Writing", icon: PencilEdit02Icon },
	{ key: "speaking", label: "Speaking", icon: Mic01Icon },
]

const skillColor: Record<Skill, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

const skillBarBg: Record<Skill, string> = {
	listening: "bg-skill-listening",
	reading: "bg-skill-reading",
	writing: "bg-skill-writing",
	speaking: "bg-skill-speaking",
}

const trendDisplay: Record<Trend, { text: string; className: string }> = {
	improving: { text: "↑ Đang tiến bộ", className: "text-success" },
	stable: { text: "→ Ổn định", className: "text-muted-foreground" },
	declining: { text: "↓ Giảm", className: "text-destructive" },
	inconsistent: { text: "~ Không đều", className: "text-warning" },
	insufficient_data: { text: "— Chưa đủ dữ liệu", className: "text-muted-foreground" },
}

function ProgressOverviewPage() {
	const spider = useSpiderChart()
	const progress = useProgress()

	if (spider.isLoading || progress.isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (spider.error || progress.error) {
		const err = spider.error || progress.error
		return <p className="py-10 text-center text-destructive">Lỗi: {err?.message}</p>
	}

	const spiderData = spider.data
	const goal = spiderData?.goal ?? progress.data?.goal ?? null
	const hasData = spiderData && Object.keys(spiderData.skills).length > 0

	if (!hasData) {
		return (
			<div className="py-20 text-center">
				<p className="text-lg font-medium">Hãy làm bài thi đầu tiên!</p>
				<p className="mt-2 text-muted-foreground">Chưa có dữ liệu tiến độ để hiển thị.</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Tiến độ học tập</h1>
				<p className="mt-1 text-muted-foreground">Theo dõi sự tiến bộ của bạn qua từng kỹ năng</p>
			</div>

			<div className="grid gap-8 lg:grid-cols-[1fr_300px]">
				<div className="space-y-8">
					<SkillBars skills={spiderData.skills} />
					<EtaSection eta={spiderData.eta} />
				</div>
				<Sidebar goal={goal} />
			</div>
		</div>
	)
}

function SkillBars({ skills }: { skills: Record<Skill, { current: number; trend: Trend }> }) {
	return (
		<div className="space-y-4">
			{SKILLS.map(({ key, label, icon }) => {
				const data = skills[key]
				if (!data) return null
				const pct = Math.min(100, (data.current / 10) * 100)
				const trend = trendDisplay[data.trend]

				return (
					<Link
						key={key}
						to="/progress/$skill"
						params={{ skill: key }}
						className="block rounded-xl bg-muted/30 p-4 transition-colors hover:bg-muted/50"
					>
						<div className="mb-2 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div
									className={cn(
										"flex size-9 items-center justify-center rounded-lg",
										skillColor[key],
									)}
								>
									<HugeiconsIcon icon={icon} className="size-5" />
								</div>
								<span className="font-medium">{label}</span>
							</div>
							<div className="flex items-center gap-3">
								<span className={cn("text-sm", trend.className)}>{trend.text}</span>
								<span className="font-bold tabular-nums">{data.current.toFixed(1)}</span>
							</div>
						</div>
						<div className="h-2 overflow-hidden rounded-full bg-muted">
							<div
								className={cn("h-full rounded-full transition-all", skillBarBg[key])}
								style={{ width: `${pct}%` }}
							/>
						</div>
					</Link>
				)
			})}
		</div>
	)
}

function EtaSection({
	eta,
}: {
	eta: { weeks: number | null; perSkill: Record<Skill, number | null> }
}) {
	if (!eta.weeks) return null

	return (
		<div className="rounded-xl bg-muted/30 p-5">
			<div className="mb-3 flex items-center gap-2">
				<HugeiconsIcon icon={Clock01Icon} className="size-5 text-muted-foreground" />
				<h3 className="font-semibold">Thời gian ước tính đạt mục tiêu</h3>
			</div>
			<p className="mb-3 text-2xl font-bold">{eta.weeks} tuần</p>
			<div className="grid grid-cols-2 gap-2">
				{SKILLS.map(({ key, label }) => (
					<div key={key} className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{label}</span>
						<span className="font-medium tabular-nums">
							{eta.perSkill[key] != null ? `${eta.perSkill[key]} tuần` : "—"}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

function Sidebar({
	goal,
}: {
	goal: { targetBand: string; deadline: string; dailyStudyTimeMinutes: number | null } | null
}) {
	return (
		<div className="space-y-4">
			{goal && (
				<div className="rounded-xl bg-muted/30 p-5">
					<div className="mb-3 flex items-center gap-2">
						<HugeiconsIcon icon={Target02Icon} className="size-5 text-muted-foreground" />
						<h3 className="font-semibold">Mục tiêu</h3>
					</div>
					<dl className="space-y-2 text-sm">
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Mục tiêu</dt>
							<dd className="font-medium">{goal.targetBand}</dd>
						</div>
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Hạn</dt>
							<dd className="font-medium">{new Date(goal.deadline).toLocaleDateString("vi-VN")}</dd>
						</div>
						{goal.dailyStudyTimeMinutes != null && (
							<div className="flex justify-between">
								<dt className="text-muted-foreground">Học mỗi ngày</dt>
								<dd className="font-medium">{goal.dailyStudyTimeMinutes} phút</dd>
							</div>
						)}
					</dl>
				</div>
			)}

			<div className="rounded-xl bg-muted/30 p-5">
				<h3 className="mb-3 font-semibold">Chi tiết kỹ năng</h3>
				<div className="space-y-2">
					{SKILLS.map(({ key, label, icon }) => (
						<Link
							key={key}
							to="/progress/$skill"
							params={{ skill: key }}
							className={cn(
								"flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50",
							)}
						>
							<div
								className={cn(
									"flex size-8 items-center justify-center rounded-lg",
									skillColor[key],
								)}
							>
								<HugeiconsIcon icon={icon} className="size-4" />
							</div>
							<span className="text-sm font-medium">{label}</span>
						</Link>
					))}
				</div>
			</div>
		</div>
	)
}
