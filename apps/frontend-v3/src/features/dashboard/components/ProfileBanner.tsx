import { useQuery } from "@tanstack/react-query"
import { overviewQuery, selectProfile } from "#/features/dashboard/queries"
import { cn, formatVnDate } from "#/lib/utils"

type LevelVariant = "done" | "active" | "target"

export function ProfileBanner() {
	const { data: profile } = useQuery({ ...overviewQuery, select: selectProfile })
	if (!profile) return null

	const entry = profile.entry_level ?? "—"
	const predicted = profile.predicted_level ?? entry
	const target = profile.target_level

	return (
		<section className="relative overflow-hidden rounded-(--radius-banner) bg-gradient-to-br from-primary-light via-primary to-primary-dark p-8 md:p-10">
			<div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
			<div className="absolute -bottom-6 right-24 w-20 h-20 rounded-full bg-white/[0.08]" />

			<div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
				<div className="flex items-center gap-5">
					<div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-primary-foreground font-display text-3xl">
						{profile.nickname.charAt(0).toUpperCase()}
					</div>
					<div>
						<h3 className="font-extrabold text-3xl text-primary-foreground">Hi, {profile.nickname}</h3>
						<p className="text-white/85 text-lg mt-1">
							{profile.days_until_exam != null ? (
								<>
									Còn <strong className="font-bold">{profile.days_until_exam} ngày</strong> diễn ra kỳ thi.
									Giữ vững tập trung nhé!
								</>
							) : (
								"Đặt mục tiêu để bắt đầu lộ trình!"
							)}
						</p>
					</div>
				</div>

				<div className="flex flex-col items-start md:items-end gap-2 min-w-[260px]">
					<div className="w-full">
						<p className="text-xs font-semibold text-white/80 mb-1">Trình độ của bạn</p>
						<div className="flex items-center justify-between gap-1 rounded-2xl bg-white/15 px-4 py-3">
							<LevelItem label="Đầu vào" value={entry} variant="done" />
							<LevelConnector />
							<LevelItem label="Dự đoán" value={predicted} variant="active" highlight />
							<LevelConnector />
							<LevelItem label="Mục tiêu" value={target} variant="target" />
						</div>
						{profile.target_deadline && (
							<p className="text-right text-xs text-white/70 mt-1">
								Ngày thi dự kiến:{" "}
								<strong className="text-white/90">{formatVnDate(profile.target_deadline)}</strong>
							</p>
						)}
					</div>
				</div>
			</div>
		</section>
	)
}

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
		<div className="flex flex-col items-center gap-1 text-center min-w-[56px]">
			<span className="text-[11px] text-white/70 leading-none">{label}</span>
			<span
				className={cn(
					"w-3 h-3 rounded-full border-2 border-white",
					variant === "done" && "bg-white",
					variant === "active" && "bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.25)]",
					variant === "target" && "bg-transparent",
				)}
			/>
			<span className={cn("text-sm font-bold", highlight ? "text-blue-200" : "text-white")}>{value}</span>
		</div>
	)
}

function LevelConnector() {
	return <span className="flex-1 h-px bg-white/30 mt-1" />
}
