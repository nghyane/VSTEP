import { Link } from "@tanstack/react-router"
import bookIcon from "#/assets/icons/book-default.svg"
import micIcon from "#/assets/icons/microphone-small.svg"
import volumeIcon from "#/assets/icons/volume-small.svg"
import weightsIcon from "#/assets/icons/weights-small.svg"

const ITEMS = [
	{
		label: "Nghe",
		en: "Listening",
		desc: "Nghe hiểu · 3 phần",
		meta: "12 bài",
		progress: 0.6,
		icon: volumeIcon,
		to: "/luyen-tap/nghe",
		color: "bg-skill-listening",
		textColor: "text-skill-listening",
	},
	{
		label: "Đọc",
		en: "Reading",
		desc: "Đọc hiểu · 4 đoạn văn",
		meta: "9 bài",
		progress: 0.45,
		icon: bookIcon,
		to: "/luyen-tap/doc",
		color: "bg-skill-reading",
		textColor: "text-skill-reading",
	},
	{
		label: "Viết",
		en: "Writing",
		desc: "Task 1 (thư) + Task 2 (luận)",
		meta: "6 bài",
		progress: 0.3,
		icon: weightsIcon,
		to: "/luyen-tap/viet",
		color: "bg-skill-writing",
		textColor: "text-skill-writing",
	},
	{
		label: "Nói",
		en: "Speaking",
		desc: "3 phần · ghi âm + AI chấm",
		meta: "4 bài",
		progress: 0.2,
		icon: micIcon,
		to: "/luyen-tap/noi",
		color: "bg-skill-speaking",
		textColor: "text-coin-dark",
	},
] as const

export function SkillsSection() {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Kỹ năng</h3>
			<p className="text-sm text-subtle mb-5">Luyện 4 kỹ năng VSTEP · bật/tắt hỗ trợ tùy nhu cầu</p>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{ITEMS.map((item) => (
					<Link key={item.label} to={item.to} className="card-interactive p-5">
						<img src={item.icon} className="w-10 h-10 object-contain mb-3" alt="" />
						<h4 className="font-bold text-base text-foreground">{item.label}</h4>
						<p className="text-xs text-subtle mt-0.5">{item.en}</p>
						<p className="text-sm text-muted mt-2">{item.desc}</p>

						<div className="mt-4">
							<div className="flex items-center justify-between mb-1.5">
								<span className="text-xs text-subtle">{item.meta}</span>
								<span className={`text-xs font-bold ${item.textColor}`}>
									{Math.round(item.progress * 100)}%
								</span>
							</div>
							<div className="h-2 bg-border rounded-full overflow-hidden">
								<div
									className={`h-full ${item.color} rounded-full transition-all`}
									style={{ width: `${item.progress * 100}%` }}
								/>
							</div>
						</div>
					</Link>
				))}
			</div>
		</section>
	)
}
