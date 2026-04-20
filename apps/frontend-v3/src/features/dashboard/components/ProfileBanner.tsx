import { useQuery } from "@tanstack/react-query"
import { overviewQuery, selectProfile } from "#/features/dashboard/queries"

export function ProfileBanner() {
	const { data: profile } = useQuery({ ...overviewQuery, select: selectProfile })
	if (!profile) return null

	return (
		<section className="relative overflow-hidden rounded-(--radius-banner) bg-gradient-to-br from-primary-light via-primary to-primary-dark p-8 md:p-10">
			<div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
			<div className="absolute -bottom-6 right-24 w-20 h-20 rounded-full bg-white/[0.08]" />

			<div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
				<div className="flex items-center gap-5">
					<div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-primary-foreground font-display text-3xl">
						{profile.nickname?.charAt(0).toUpperCase() ?? "?"}
					</div>
					<div>
						<h3 className="font-extrabold text-3xl text-primary-foreground">Hi, {profile.nickname}</h3>
						<p className="text-white/85 text-lg mt-1">
							{profile.days_until_exam != null ? (
								<>
									Còn <strong className="font-bold">{profile.days_until_exam} ngày</strong> đến kỳ thi — giữ
									vững tập trung!
								</>
							) : (
								"Đặt mục tiêu để bắt đầu lộ trình!"
							)}
						</p>
					</div>
				</div>

				{profile.target_level && (
					<div className="bg-white/15 rounded-2xl p-4 min-w-[200px]">
						<p className="text-xs text-white/70 font-semibold mb-2">Mục tiêu</p>
						<span className="font-display text-2xl text-primary-foreground">{profile.target_level}</span>
						{profile.target_deadline && (
							<p className="text-xs text-white/70 mt-1">{profile.target_deadline}</p>
						)}
					</div>
				)}
			</div>
		</section>
	)
}
