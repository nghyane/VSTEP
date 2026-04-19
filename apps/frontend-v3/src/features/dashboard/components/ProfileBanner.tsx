export function ProfileBanner() {
	return (
		<section className="relative overflow-hidden rounded-[--radius-banner] bg-gradient-to-br from-primary-light via-primary to-primary-dark p-8 md:p-10">
			<div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
			<div className="absolute -bottom-6 right-24 w-20 h-20 rounded-full bg-white/[0.08]" />

			<div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
				<div className="flex items-center gap-5">
					<div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-primary-foreground font-display text-3xl">
						N
					</div>
					<div>
						<h3 className="font-extrabold text-3xl text-primary-foreground">Hi, Nghĩa</h3>
						<p className="text-white/85 text-lg mt-1">
							Còn <strong className="font-bold">45 ngày</strong> đến kỳ thi ĐH Văn Lang — giữ vững tập trung!
						</p>
					</div>
				</div>

				<div className="bg-white/15 rounded-2xl p-4 min-w-[260px]">
					<div className="flex items-center justify-between mb-2">
						<span className="text-xs text-white/70 font-semibold">Đầu vào</span>
						<span className="text-xs text-white/70 font-semibold">Dự đoán</span>
						<span className="text-xs text-white/70 font-semibold">Mục tiêu</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="font-bold text-primary-foreground text-lg">A2</span>
						<div className="flex-1 h-px bg-white/30 mx-3" />
						<span className="font-display text-2xl text-info-tint">B1</span>
						<div className="flex-1 h-px bg-white/30 mx-3" />
						<span className="font-bold text-primary-foreground text-lg">B2</span>
					</div>
				</div>
			</div>
		</section>
	)
}
