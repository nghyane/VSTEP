import { Link } from "@tanstack/react-router"

const ITEMS = [
	{
		label: "Từ vựng",
		desc: "Flashcard SRS · 60+ chủ đề theo level",
		meta: "12 / 28 chủ đề",
		progress: 0.43,
		to: "/luyen-tap/tu-vung",
		color: "var(--color-skill-writing)",
	},
	{
		label: "Ngữ pháp",
		desc: "Cấu trúc câu gắn level A2–C1",
		meta: "45 / 120 điểm",
		progress: 0.38,
		to: "/luyen-tap/ngu-phap",
		color: "var(--color-skill-reading)",
	},
] as const

export function FoundationSection() {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Nền tảng</h3>
			<p className="text-sm text-subtle mb-5">Từ vựng và ngữ pháp — gốc rễ mọi kỹ năng</p>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{ITEMS.map((item) => (
					<Link key={item.label} to={item.to} className="card-interactive p-5">
						<div className="flex items-start justify-between mb-3">
							<div>
								<h4 className="font-bold text-lg text-foreground">{item.label}</h4>
								<p className="text-sm text-subtle mt-0.5">{item.desc}</p>
							</div>
							<span className="text-sm font-bold text-muted">{item.meta}</span>
						</div>
						<div className="h-2 bg-border rounded-full overflow-hidden">
							<div
								className="h-full rounded-full transition-all"
								style={{ width: `${item.progress * 100}%`, background: item.color }}
							/>
						</div>
					</Link>
				))}
			</div>
		</section>
	)
}
