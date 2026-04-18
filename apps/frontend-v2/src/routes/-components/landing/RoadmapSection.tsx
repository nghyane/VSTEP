import { ROADMAP_BANDS } from "./constants"

export function RoadmapSection() {
	return (
		<section aria-label="Lộ trình học">
			<div className="mx-auto w-full max-w-3xl px-6 py-20">
				<div className="text-center">
					<h2 className="text-2xl font-bold lg:text-3xl">Lộ trình rõ ràng</h2>
					<p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
						Từ B1 đến C1 — mỗi cấp độ là một bước tiến cụ thể
					</p>
				</div>
				<div className="relative mt-14 pl-10">
					<div className="absolute bottom-0 left-5 top-0 w-px bg-border" />
					{ROADMAP_BANDS.map((band) => (
						<div key={band.level} className="relative mb-6 last:mb-0">
							<div className="absolute -left-[1.875rem] top-5 size-4 rounded-full bg-background ring-4 ring-background">
								<div className="size-4 rounded-full border border-primary/30 bg-primary/10" />
							</div>
							<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
								<div className="flex items-center gap-3">
									<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
										{band.level}
									</span>
									<h3 className="text-lg font-semibold">{band.label}</h3>
								</div>
								<p className="mt-2 text-sm text-muted-foreground">{band.desc}</p>
								<div className="mt-3 flex flex-wrap gap-1.5">
									{band.items.map((item) => (
										<span
											key={item}
											className="rounded-md border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
										>
											{item}
										</span>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
