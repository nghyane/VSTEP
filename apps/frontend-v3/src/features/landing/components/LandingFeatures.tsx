import { Icon } from "#/components/Icon"

interface FeatureRow {
	mascot: string
	flip: boolean
	step: string
	eyebrow: string
	title: string
	body: string
	bullets: string[]
}

const FEATURES: FeatureRow[] = [
	{
		mascot: "/mascot/lac-write.png",
		flip: false,
		step: "01",
		eyebrow: "Thi thử",
		title: "Đề chuẩn, timer chuẩn, tâm lý vững.",
		body: "Đề từ ngân hàng đề HNUE và Văn Lang. Timer server đếm ngược chính xác. Format khớp 100% với phòng thi thật.",
		bullets: ["50+ đề thi cập nhật", "Timer server không bị gian lận", "Mô phỏng đúng phòng thi VSTEP"],
	},
	{
		mascot: "/mascot/lac-read.png",
		flip: true,
		step: "02",
		eyebrow: "Học mỗi ngày",
		title: "Vừa đủ để giỏi, không quá để nản.",
		body: "Từ vựng SRS nhớ lâu, ngữ pháp theo level, nghe đọc viết nói đều có chế độ hỗ trợ. Streak giữ thói quen mà không tạo áp lực.",
		bullets: [
			"FSRS adaptive cho từ vựng",
			"Ngữ pháp tách theo level A1–C1",
			"Streak nhẹ nhàng, không reset gắt",
		],
	},
	{
		mascot: "/mascot/lac-think.png",
		flip: false,
		step: "03",
		eyebrow: "AI chấm bài",
		title: "Biết sai ở đâu, sửa thế nào.",
		body: "Phân tích điểm mạnh, gợi ý cải thiện, viết lại từng câu theo rubric chính thức của Bộ Giáo dục.",
		bullets: [
			"Strengths · Improvements · Rewrites",
			"Điểm theo từng tiêu chí rubric",
			"Lưu lịch sử để so sánh tiến độ",
		],
	},
]

export function LandingFeatures() {
	return (
		<section className="py-14 sm:py-20 lg:py-24 bg-background">
			<div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-14 sm:gap-20 lg:gap-24">
				{FEATURES.map((f) => (
					<FeatureRowView key={f.title} data={f} />
				))}
			</div>
		</section>
	)
}

function FeatureRowView({ data }: { data: FeatureRow }) {
	return (
		<div
			className={`flex flex-col gap-7 sm:gap-10 lg:gap-20 items-center ${data.flip ? "lg:flex-row-reverse" : "lg:flex-row"}`}
		>
			<div className="shrink-0 w-44 h-44 sm:w-60 sm:h-60 lg:w-[300px] lg:h-[300px] flex items-center justify-center">
				<img src={data.mascot} alt="" className="w-full h-full object-contain" />
			</div>
			<div className="flex-1 text-center lg:text-left">
				<div className="flex items-center gap-3 mb-3 justify-center lg:justify-start">
					<span className="font-sans font-extrabold text-3xl text-primary leading-none tracking-tight">
						{data.step}
					</span>
					<span className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-dark">
						{data.eyebrow}
					</span>
				</div>
				<h2 className="font-sans font-extrabold text-2xl md:text-3xl lg:text-[36px] text-foreground leading-tight tracking-tight">
					{data.title}
				</h2>
				<p className="text-sm sm:text-base text-muted mt-4 max-w-lg mx-auto lg:mx-0 leading-relaxed">
					{data.body}
				</p>
				<ul className="mt-5 space-y-2 text-sm text-muted max-w-lg mx-auto lg:mx-0">
					{data.bullets.map((b) => (
						<li key={b} className="flex items-start gap-2 leading-relaxed">
							<Icon name="check" size="xs" className="text-primary shrink-0 mt-0.5" />
							{b}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
