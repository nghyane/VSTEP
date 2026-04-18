import { STEPS } from "./constants"

export function HowItWorksSection() {
	return (
		<section id="how-it-works" className="bg-muted/20 py-20" aria-label="Cách hoạt động">
			<div className="mx-auto w-full max-w-5xl px-6">
				<div className="text-center">
					<h2 className="text-2xl font-bold lg:text-3xl">3 bước bắt đầu</h2>
					<p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
						Từ làm đề đến nhận lộ trình — tất cả chỉ trong vài phút.
					</p>
				</div>

				<div className="mt-14 space-y-16">
					{STEPS.map((step, i) => {
						const Icon = step.icon
						const reverse = i % 2 === 1
						return (
							<div
								key={step.title}
								className={`flex flex-col gap-8 lg:items-center lg:gap-12 ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}
							>
								<div className="flex-1 space-y-4">
									<span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
										<Icon className="size-3.5" />
										Bước {i + 1}
									</span>
									<h3 className="text-xl font-bold lg:text-2xl">{step.title}</h3>
									<p className="leading-relaxed text-muted-foreground">{step.desc}</p>
								</div>
								<div className="flex-1 overflow-hidden rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card">
									<img
										src={step.image}
										alt={step.title}
										loading="lazy"
										className="aspect-video w-full object-cover"
									/>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
