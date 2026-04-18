// ProfileBanner — banner xanh gradient đầu trang Overview
// Spec: rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-8
// Source: progress/index.tsx ProfileCard + Prep UI level track

import { Route } from "lucide-react"
import type { Level } from "#/lib/onboarding/types"
import type { OverviewData } from "#/mocks/overview"
import { Button } from "#/shared/ui/button"

interface LevelTrack {
	entryLevel: Level
	predictedLevel: Level
	targetLevel: Level
	examDate: string
}

interface Props {
	user: OverviewData["user"]
	onStartOnboarding: () => void
	levelTrack: LevelTrack | null
}

export function ProfileBanner({ user, onStartOnboarding, levelTrack }: Props) {
	return (
		<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-6 py-6 md:px-8 md:py-8">
			{/* Decorative circles */}
			<div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/5" />
			<div className="absolute -bottom-4 -right-4 size-20 rounded-full bg-white/5" />

			<div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
				{/* Left: avatar + greeting — căn giữa theo chiều dọc của cột trái */}
				<div className="flex items-center gap-5">
					<div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white">
						{user.initials}
					</div>
					<div>
						<h2 className="text-2xl font-bold text-white md:text-3xl">Hi, {user.fullName}</h2>
						<p className="mt-1.5 text-base text-white/85 md:text-lg">
							Còn <strong className="font-bold">{user.daysUntilExam} ngày</strong> diễn ra kỳ thi.
							Giữ vững tập trung nhé!
						</p>
					</div>
				</div>

				{/* Right: level track + edit */}
				<div className="flex flex-col items-start gap-3 md:items-end">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25 hover:text-white"
						onClick={onStartOnboarding}
					>
						<Route className="size-3" />
						Đặt mục tiêu
					</Button>

					{/* Level track */}
					<div className="flex flex-col gap-1">
						<p className="text-xs font-semibold text-white/80">Trình độ của bạn</p>
						<div className="flex items-center gap-0 rounded-xl bg-white/15 px-4 py-2.5">
							<LevelItem
								label="Đầu vào"
								value={levelTrack ? levelTrack.entryLevel : user.entryLevel}
								variant="done"
							/>
							<LevelConnector />
							<LevelItem
								label="Dự đoán"
								value={levelTrack ? levelTrack.predictedLevel : user.predictedLevel}
								variant="active"
								highlight
							/>
							<LevelConnector />
							<LevelItem
								label="Mục tiêu"
								value={levelTrack ? levelTrack.targetLevel : user.targetLevel}
								variant="target"
							/>
						</div>
						<p className="text-right text-[10px] text-white/60">
							Ngày thi dự kiến:{" "}
							<strong className="text-white/80">
								{levelTrack ? levelTrack.examDate : user.examDate}
							</strong>
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Sub-components ───────────────────────────────────────────────

type LevelVariant = "done" | "active" | "target"

function LevelItem({
	label,
	value,
	variant,
	highlight,
}: {
	label: string
	value: string
	variant: LevelVariant
	highlight?: boolean
}) {
	return (
		<div className="flex min-w-[56px] flex-col items-center gap-1 text-center">
			<span className="text-[10px] text-white/70">{label}</span>
			<div
				className={[
					"size-3 rounded-full border-2",
					variant === "done" ? "border-white bg-white" : "",
					variant === "active"
						? "border-white bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.25)]"
						: "",
					variant === "target" ? "border-white bg-transparent" : "",
				].join(" ")}
			/>
			<span className={["text-sm font-bold", highlight ? "text-blue-200" : "text-white"].join(" ")}>
				{value}
			</span>
		</div>
	)
}

function LevelConnector() {
	return <div className="mx-1 self-center h-px w-6 bg-white/30" />
}
