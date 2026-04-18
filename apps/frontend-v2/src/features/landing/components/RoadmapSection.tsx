import { AnimSection, SectionHeading, useInView } from "../lib/shared"

const LEVELS = [
	{
		level: "B1",
		label: "Trung cấp",
		desc: "Giao tiếp trong công việc và đời sống hàng ngày",
		items: ["Nghe hiểu hội thoại", "Viết thư cơ bản", "Đọc hiểu văn bản ngắn"],
	},
	{
		level: "B2",
		label: "Trung cấp cao",
		desc: "Tự tin trong môi trường học thuật và chuyên môn",
		items: ["Nghe bài giảng dài", "Viết luận có cấu trúc", "Nói trôi chảy"],
	},
	{
		level: "C1",
		label: "Nâng cao",
		desc: "Sử dụng tiếng Anh linh hoạt trong mọi tình huống phức tạp",
		items: ["Nghe mọi ngữ cảnh", "Viết học thuật", "Thuyết trình chuyên sâu"],
	},
] as const

export function RoadmapSection() {
	const { ref, visible } = useInView()

	return (
		<section ref={ref} className="py-20">
			<div className="mx-auto w-full max-w-5xl px-6">
				<AnimSection>
					<SectionHeading
						title="Lộ trình rõ ràng"
						subtitle="Từ B1 đến C1 — mỗi cấp độ là một bước tiến cụ thể"
					/>
				</AnimSection>

				<AnimSection>
					<div className="relative mt-16">
						<div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 overflow-hidden bg-border/30">
							{visible && (
								<div
									className="h-full w-full animate-[grow-line_1.2s_ease-out_forwards] bg-border"
									style={{ transformOrigin: "top" }}
								/>
							)}
						</div>

						<div className="space-y-12">
							{LEVELS.map((band, i) => {
								const isLeft = i % 2 === 0
								return (
									<div
										key={band.level}
										className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]"
									>
										{isLeft ? (
											<div className="md:pr-8 md:text-right">
												{visible && (
													<div
														className="animate-[fade-slide_0.6s_ease-out_forwards] opacity-0"
														style={{ animationDelay: `${i * 400 + 200}ms` }}
													>
														<LevelCard band={band} align="right" />
													</div>
												)}
											</div>
										) : (
											<div />
										)}

										<div className="absolute left-1/2 top-6 -translate-x-1/2 md:relative md:left-0 md:top-0 md:translate-x-0">
											{visible && (
												<div
													className={`absolute top-1/2 hidden h-px w-8 -translate-y-1/2 animate-[grow-branch_0.3s_ease-out_forwards] bg-border opacity-0 md:block ${isLeft ? "right-full origin-right" : "left-full origin-left"}`}
													style={{ animationDelay: `${i * 400 + 100}ms` }}
												/>
											)}
										</div>

										{!isLeft ? (
											<div className="md:pl-8">
												{visible && (
													<div
														className="animate-[fade-slide_0.6s_ease-out_forwards] opacity-0"
														style={{ animationDelay: `${i * 400 + 200}ms` }}
													>
														<LevelCard band={band} align="left" />
													</div>
												)}
											</div>
										) : (
											<div />
										)}
									</div>
								)
							})}
						</div>
					</div>
				</AnimSection>
			</div>
		</section>
	)
}

function LevelCard({ band, align }: { band: (typeof LEVELS)[number]; align: "left" | "right" }) {
	return (
		<div className="inline-block rounded-2xl bg-muted/50 p-5 text-left shadow-sm md:max-w-sm">
			<div className={`flex items-center gap-2 ${align === "right" ? "md:justify-end" : ""}`}>
				<span className="rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-primary-foreground">
					{band.level}
				</span>
			</div>
			<h3 className="mt-2 text-lg font-semibold">{band.label}</h3>
			<p className="mt-1 text-sm text-muted-foreground">{band.desc}</p>
			<div className="mt-3 flex flex-wrap gap-1.5">
				{band.items.map((item) => (
					<span key={item} className="rounded-md border bg-background px-2.5 py-1 text-xs">
						{item}
					</span>
				))}
			</div>
		</div>
	)
}
