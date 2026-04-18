import { Button } from "#/components/ui/button"

export function CtaSection({ onOpenAuth }: { onOpenAuth: () => void }) {
	return (
		<section aria-label="Bắt đầu luyện tập">
			<div className="mx-auto w-full max-w-5xl px-6 py-20">
				<div className="relative overflow-hidden rounded-3xl bg-muted/30 px-6 py-16 text-center sm:px-12">
					<div className="relative z-10 mx-auto max-w-2xl">
						<h2 className="text-2xl font-bold lg:text-4xl">Bắt đầu luyện ngay hôm nay</h2>
						<p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
							Không cần thẻ tín dụng. Tạo tài khoản trong 30 giây và làm bài thi thử đầu tiên với
							phản hồi AI chi tiết.
						</p>
						<Button
							size="lg"
							className="mt-6 rounded-full px-10 text-base font-bold"
							onClick={onOpenAuth}
						>
							Bắt đầu miễn phí
						</Button>
					</div>

					{/* Mascot peeking from bottom */}
					<img
						src="/images/home-mascot.png"
						alt="Mascot VSTEP"
						loading="lazy"
						className="relative z-0 mx-auto -mb-16 mt-6 w-full max-w-3xl object-contain"
					/>
				</div>
			</div>
		</section>
	)
}
