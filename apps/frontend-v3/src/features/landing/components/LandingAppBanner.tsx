import { MOBILE_APP_DOWNLOAD_URL } from "../mobile-app"

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
							VSTEP mobile app đã ra mắt
						</h2>
						<p className="mt-2 text-sm leading-relaxed text-muted">
							Tải APK Android để luyện thi, làm bài và xem kết quả chấm ngay trên điện thoại. Web vẫn tối ưu
							cho trải nghiệm đầy đủ trên máy tính.
						</p>
					</div>
					<a
						href={MOBILE_APP_DOWNLOAD_URL}
						className="btn btn-primary w-full px-5 py-3 text-sm sm:w-auto"
						download="vstepGO.apk"
					>
						Tải APK
					</a>
				</div>
			</div>
		</section>
	)
}
