import { CheckCircle2 } from "lucide-react"
import { Button } from "#/shared/ui/button"
import { AnimSection } from "../lib/shared"

export function MascotSection({ onOpenAuth }: { onOpenAuth: () => void }) {
	return (
		<section className="relative overflow-hidden py-20">
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
			<div className="relative mx-auto w-full max-w-4xl px-6">
				<AnimSection>
					<div className="relative overflow-hidden rounded-3xl border bg-card shadow-lg">
						<div className="relative min-h-[200px] pt-3">
							<img
								src="/images/home-mascot.png"
								alt=""
								className="h-full w-full object-contain object-bottom [filter:drop-shadow(2px_0_0_#000)_drop-shadow(-2px_0_0_#000)_drop-shadow(0_2px_0_#000)_drop-shadow(0_-2px_0_#000)]"
							/>
							<div className="absolute inset-0 flex flex-col justify-between p-0">
								<div className="pt-3 text-center">
									<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
										Bắt đầu luyện ngay hôm nay
									</h2>
									<p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
										Không cần thẻ tín dụng. Tạo tài khoản trong 30 giây và làm bài thi thử đầu tiên
										với lộ trình rõ ràng, phản hồi AI chi tiết.
									</p>
								</div>
								<div className="flex flex-col items-center pb-3 text-center">
									<Button
										size="lg"
										className="rounded-full bg-white px-8 text-base text-foreground shadow-lg hover:bg-white/90"
										onClick={onOpenAuth}
									>
										Bắt đầu miễn phí
									</Button>
									<div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:gap-4">
										<div className="flex items-center gap-2">
											<CheckCircle2 className="size-4 text-success" />
											<span className="font-semibold">Hoàn toàn miễn phí</span>
										</div>
										<div className="flex items-center gap-2">
											<CheckCircle2 className="size-4 text-success" />
											<span className="font-semibold">10,000+ học viên</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</AnimSection>
			</div>
		</section>
	)
}
