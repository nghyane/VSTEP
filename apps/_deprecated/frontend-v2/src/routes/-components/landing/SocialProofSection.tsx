import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "#/shared/ui/avatar"
import { TESTIMONIALS } from "./constants"

export function SocialProofSection() {
	return (
		<section aria-label="Đánh giá và số liệu">
			<div className="relative overflow-hidden bg-gradient-to-b from-primary to-primary/80 py-20">
				{/* Decorative */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/5" />
					<div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-white/5" />
				</div>

				<div className="relative mx-auto w-full max-w-5xl px-6">
					{/* Stats bar */}
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						{[
							{ value: "50+", label: "Đề thi thử" },
							{ value: "2,000+", label: "Câu hỏi" },
							{ value: "10,000+", label: "Học viên" },
							{ value: "92%", label: "Tăng ít nhất 1 band" },
						].map((s) => (
							<div
								key={s.label}
								className="rounded-2xl bg-white/10 px-4 py-5 text-center backdrop-blur-sm"
							>
								<p className="text-2xl font-bold text-white sm:text-3xl">{s.value}</p>
								<p className="mt-1 text-sm text-white/60">{s.label}</p>
							</div>
						))}
					</div>

					{/* Heading */}
					<div className="mt-14 text-center">
						<h2 className="text-2xl font-bold text-white lg:text-3xl">Học viên nói gì?</h2>
						<p className="mx-auto mt-3 max-w-2xl text-white/60">
							Hàng nghìn người đã cải thiện điểm VSTEP
						</p>
					</div>

					{/* Testimonials */}
					<div className="mt-10 grid gap-4 sm:grid-cols-3">
						{TESTIMONIALS.map((item) => (
							<div key={item.name} className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
								<div className="flex items-center gap-3">
									<Avatar size="lg">
										<AvatarImage src={item.avatar} alt={item.name} />
										<AvatarFallback className="bg-white/20 text-white">
											{item.initials}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-bold text-white">{item.name}</p>
										<p className="text-xs text-white/60">{item.role}</p>
									</div>
								</div>
								<div className="mt-3 flex gap-0.5">
									{Array.from({ length: 5 }).map((_, i) => (
										<Star key={i} className="size-3.5 fill-warning text-warning" />
									))}
								</div>
								<p className="mt-3 text-sm italic leading-relaxed text-white/80">"{item.quote}"</p>
								<span className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
									{item.badge}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}
