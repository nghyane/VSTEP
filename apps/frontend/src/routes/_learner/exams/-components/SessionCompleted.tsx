import { AlertCircleIcon, BulbIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { SpiderChart } from "@/components/common/SpiderChart"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Exam, ExamSessionDetail, Skill } from "@/types/api"
import { skillColor, skillMeta } from "./skill-meta"

interface SessionCompletedProps {
	session: ExamSessionDetail
	exam: Exam | null
}

const bandLabel: Record<string, string> = {
	B1: "B1 – Trung cấp",
	B2: "B2 – Trung cao cấp",
	C1: "C1 – Cao cấp",
}

export function SessionCompleted({ session, exam }: SessionCompletedProps) {
	const scores: { skill: Skill; score: number | null; label: string }[] = [
		{ skill: "listening", score: session.listeningScore, label: skillMeta.listening.label },
		{ skill: "reading", score: session.readingScore, label: skillMeta.reading.label },
		{ skill: "writing", score: session.writingScore, label: skillMeta.writing.label },
		{ skill: "speaking", score: session.speakingScore, label: skillMeta.speaking.label },
	]

	const graded = scores.filter((s) => s.score !== null)
	const strong = graded.filter((s) => s.score! >= 7)
	const weak = graded.filter((s) => s.score! < 7)
	const weakest = [...graded].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0] as
		| (typeof scores)[number]
		| undefined

	const spiderSkills = scores.map((s) => ({
		label: s.label,
		value: s.score ?? 0,
		color: `text-skill-${s.skill}`,
	}))

	const isSubmitted = session.status === "submitted"

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="rounded-2xl bg-muted/30 p-6">
				<h1 className="text-xl font-bold">Kết quả thi {exam ? `— Đề ${exam.level}` : ""}</h1>
				{session.completedAt && (
					<p className="mt-1 text-sm text-muted-foreground">
						{new Date(session.completedAt).toLocaleString("vi-VN")}
					</p>
				)}
			</div>

			{/* Grading in progress banner */}
			{isSubmitted && (
				<div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
					<span className="relative flex size-3">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
						<span className="relative inline-flex size-3 rounded-full bg-amber-500" />
					</span>
					<div>
						<p className="font-semibold text-amber-700 dark:text-amber-400">Đang chấm bài...</p>
						<p className="text-sm text-amber-600/80 dark:text-amber-400/70">
							AI đang chấm Writing và Speaking. Thường mất 1-2 phút.
						</p>
					</div>
				</div>
			)}

			{/* Overall score + band */}
			{session.overallScore !== null && (
				<div className="rounded-2xl bg-primary/10 p-6 text-center">
					<p className="text-sm font-medium text-muted-foreground">Điểm tổng</p>
					<p className="mt-1 text-4xl font-bold text-primary">
						{session.overallScore}
						<span className="text-lg font-normal text-muted-foreground"> / 10</span>
					</p>
					{session.overallBand && (
						<p className="mt-2 text-sm font-semibold text-primary">
							Band: {bandLabel[session.overallBand] ?? session.overallBand}
						</p>
					)}
				</div>
			)}

			{/* Spider chart + Skill scores */}
			<div className="grid items-center gap-6 lg:grid-cols-2">
				<SpiderChart skills={spiderSkills} className="mx-auto aspect-square w-full max-w-[320px]" />

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
					{scores.map(({ skill, score }) => {
						const meta = skillMeta[skill]
						return (
							<div
								key={skill}
								className={cn("flex items-center gap-3 rounded-xl p-4", skillColor[skill])}
							>
								<HugeiconsIcon icon={meta.icon} className="size-5" />
								<span className="font-medium">{meta.label}</span>
								<span className="ml-auto font-semibold">
									{score !== null ? `${score}/10` : "Đang chấm"}
								</span>
							</div>
						)
					})}
				</div>
			</div>

			{/* Strengths & weaknesses */}
			{graded.length > 0 && (
				<div className="space-y-4 rounded-2xl bg-muted/30 p-6">
					<h2 className="font-semibold">Phân tích điểm mạnh / yếu</h2>

					{strong.length > 0 && (
						<div className="space-y-1">
							<p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
								<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
								Mạnh
							</p>
							<ul className="space-y-1 pl-6 text-sm">
								{strong.map((s) => (
									<li key={s.skill}>
										{s.label} — <span className="font-semibold">{s.score}/10</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{weak.length > 0 && (
						<div className="space-y-1">
							<p className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
								<HugeiconsIcon icon={AlertCircleIcon} className="size-4" />
								Cần cải thiện
							</p>
							<ul className="space-y-1 pl-6 text-sm">
								{weak.map((s) => (
									<li key={s.skill}>
										{s.label} — <span className="font-semibold">{s.score}/10</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{weakest && (
						<p className="text-sm text-muted-foreground">
							<span className="inline-flex items-center gap-1.5">
								<HugeiconsIcon icon={BulbIcon} className="size-4" />
								Gợi ý: Luyện thêm {weakest.label} để nâng band tổng.
							</span>
						</p>
					)}
				</div>
			)}

			{/* CTA buttons */}
			<div className="flex flex-wrap gap-3">
				{weakest && (
					<Link to="/practice" search={{ skill: weakest.skill }}>
						<Button>Luyện {weakest.label} ngay</Button>
					</Link>
				)}
				<Link to="/practice">
					<Button variant="outline">Về trang Luyện tập</Button>
				</Link>
			</div>
		</div>
	)
}
