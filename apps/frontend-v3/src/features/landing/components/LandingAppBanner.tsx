export function LandingAppBanner() {
	return (
		<section className="px-4 pb-6 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-[960px]">
				<div className="card flex flex-col items-center gap-4 bg-primary-tint p-5 text-center sm:flex-row sm:text-left">
					<img
						src="/mascot/lac-wave.png"
						alt=""
						className="h-24 w-24 shrink-0 object-contain sm:h-28 sm:w-28"
					/>
					<div className="min-w-0 flex-1">
						<p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-dark">Mobile app</p>
						<h2 className="mt-1 text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
							VSTEP mobile app sắp ra mắt
						</h2>
						<p className="mt-2 text-sm leading-relaxed text-muted">
							Dùng điện thoại sẽ được điều hướng sang app. Web hiện tối ưu cho máy tính để luyện thi đầy đủ.
						</p>
					</div>
					<div className="rounded-full bg-surface px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-primary-dark">
						Sắp mở public
					</div>
				</div>
			</div>
		</section>
	)
}
