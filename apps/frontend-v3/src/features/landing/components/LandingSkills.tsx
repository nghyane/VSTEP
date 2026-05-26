import { Icon } from "#/components/Icon"
import { SkillIcon } from "#/components/SkillIcon"

interface SkillCardData {
	pngIcon: string
	label: string
	tagline: string
	details: string[]
}

const SKILLS: SkillCardData[] = [
	{
		pngIcon: "listening",
		label: "Nghe",
		tagline: "3 phần · audio chuẩn đề",
		details: ["Nghe lại 2 lần", "Đề chuẩn VSTEP", "Transcript khi review"],
	},
	{
		pngIcon: "reading",
		label: "Đọc",
		tagline: "4 đoạn · 40 câu",
		details: ["Tra từ khi bôi đen", "Dịch tự động bằng AI", "Highlight ý chính"],
	},
	{
		pngIcon: "writing",
		label: "Viết",
		tagline: "Thư + bài luận",
		details: ["AI chấm theo rubric", "Bài mẫu band 8+", "Phân tích từng câu"],
	},
	{
		pngIcon: "speaking",
		label: "Nói",
		tagline: "3 phần đúng format",
		details: ["Ghi âm trực tiếp", "AI chấm phát âm", "Gợi ý cải thiện"],
	},
]

export function LandingSkills() {
	return (
		<section className="py-24">
			<div className="max-w-[1140px] mx-auto px-8">
				<div className="text-center mb-14 max-w-2xl mx-auto">
					<p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary mb-3">4 kỹ năng</p>
					<h2 className="font-sans font-extrabold text-3xl md:text-4xl text-foreground leading-tight tracking-tight">
						Luyện đầy đủ Nghe — Đọc — Viết — Nói
					</h2>
					<p className="text-muted text-base mt-4 leading-relaxed">
						Tách rõ từng kỹ năng theo đúng format Bộ Giáo dục, không bắt buộc roadmap.
					</p>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
					{SKILLS.map((s) => (
						<SkillCard key={s.label} data={s} />
					))}
				</div>
			</div>
		</section>
	)
}

function SkillCard({ data }: { data: SkillCardData }) {
	return (
		<div className="card p-6 group hover:-translate-y-1 transition-transform">
			<div className="flex items-center gap-3 mb-4">
				<SkillIcon name={data.pngIcon} size="md" />
				<div>
					<h3 className="font-extrabold text-lg text-foreground leading-tight">{data.label}</h3>
					<p className="text-xs text-subtle">{data.tagline}</p>
				</div>
			</div>
			<ul className="space-y-2">
				{data.details.map((d) => (
					<li key={d} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
						<Icon name="check" size="xs" className="text-primary shrink-0 mt-0.5" />
						{d}
					</li>
				))}
			</ul>
		</div>
	)
}
