import { getAvatarUrl } from "#/lib/avatar"

interface Testimonial {
	text: string
	name: string
	subtitle: string
	avatarKey: string
}

const TESTIMONIALS: Testimonial[] = [
	{
		text: "Mình đạt B2 chỉ sau 3 tháng ôn cùng VSTEP. AI chấm writing chi tiết hơn cả thầy cô review thường ngày.",
		name: "Minh Anh",
		subtitle: "SV Bách Khoa HCM",
		avatarKey: "Alex",
	},
	{
		text: "Phần thi thử giống format thật khoảng 95%. Vào phòng thi rất quen tay, không bị bỡ ngỡ phần nào.",
		name: "Hoàng Nam",
		subtitle: "SV Kinh tế Quốc dân",
		avatarKey: "Jordan",
	},
	{
		text: "Streak nhẹ nhàng nhưng đủ để giữ thói quen. Sau 60 ngày mình đã quen với rubric VSTEP.",
		name: "Thu Hà",
		subtitle: "SV Ngoại thương",
		avatarKey: "Riley",
	},
]

export function LandingSocial() {
	return (
		<section className="py-14 sm:py-20 lg:py-24">
			<div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-9 sm:mb-12 max-w-2xl mx-auto">
					<RatingPill />
					<h2 className="font-sans font-extrabold text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight tracking-tight mt-5">
						Học viên nói gì về VSTEP?
					</h2>
					<p className="text-muted text-base mt-3 leading-relaxed">
						Hơn 2,000 học viên đã đạt mục tiêu, từ A2 lên B1, B2 và xa hơn.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-5">
					{TESTIMONIALS.map((t) => (
						<TestimonialCard key={t.name} data={t} />
					))}
				</div>
			</div>
		</section>
	)
}

function RatingPill() {
	return (
		<div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-warning-tint">
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((s) => (
					<Star key={s} />
				))}
			</div>
			<span className="text-xs font-extrabold text-foreground">4.8/5</span>
			<span className="text-xs text-muted">· 2,000+ học viên</span>
		</div>
	)
}

function Star() {
	return (
		<svg viewBox="0 0 20 20" fill="var(--color-warning)" className="w-3.5 h-3.5" aria-hidden="true">
			<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
		</svg>
	)
}

function TestimonialCard({ data }: { data: Testimonial }) {
	const avatarSrc = getAvatarUrl(data.avatarKey)

	return (
		<div className="card p-4 sm:p-6 flex flex-col gap-4">
			<Quote />
			<p className="text-[15px] text-foreground/85 leading-relaxed flex-1">{data.text}</p>
			<div className="flex items-center gap-3 pt-3 border-t border-border-light">
				<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary-tint overflow-hidden border-2 border-border">
					<img src={avatarSrc} alt="" className="w-full h-full object-cover" />
				</div>
				<div>
					<p className="text-sm font-extrabold text-foreground leading-tight">{data.name}</p>
					<p className="text-xs text-subtle">{data.subtitle}</p>
				</div>
			</div>
		</div>
	)
}

function Quote() {
	return (
		<svg viewBox="0 0 32 32" fill="var(--color-primary)" className="w-7 h-7 opacity-60" aria-hidden="true">
			<path d="M9.4 8C5.3 8 2 11.3 2 15.4c0 4 3.2 7.4 7.4 7.4h.4v1.4c0 .8-.7 1.4-1.5 1.4H6.7c-.5 0-.9.4-.9.9s.4.9.9.9h1.6c1.8 0 3.3-1.5 3.3-3.3v-9.4C11.6 11.7 10.6 8 9.4 8Zm14 0c-4.1 0-7.4 3.3-7.4 7.4 0 4 3.2 7.4 7.4 7.4h.4v1.4c0 .8-.7 1.4-1.5 1.4h-1.6c-.5 0-.9.4-.9.9s.4.9.9.9h1.6c1.8 0 3.3-1.5 3.3-3.3v-9.4C25.6 11.7 24.6 8 23.4 8Z" />
		</svg>
	)
}
