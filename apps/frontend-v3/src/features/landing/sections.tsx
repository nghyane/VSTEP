import { Link } from "@tanstack/react-router"
import { Icon, type IconName, StaticIcon } from "#/components/Icon"

export function LandingHero({ ctaRef }: { ctaRef?: React.Ref<HTMLDivElement> }) {
	return (
		<section className="max-w-6xl mx-auto px-8 pt-12 pb-16">
			<div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
				{/* Left — copy */}
				<div className="flex-1 text-center lg:text-left">
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-tint text-primary text-sm font-bold mb-6">
						<Icon name="lightning" size="xs" />
						Miễn phí 100 xu khi đăng ký
					</div>
					<h1 className="font-extrabold text-4xl md:text-5xl lg:text-[56px] text-foreground leading-[1.1] tracking-tight">
						Luyện thi VSTEP
						<br />
						<span className="text-primary">đạt B2</span> với AI
					</h1>
					<p className="text-lg text-muted mt-5 max-w-lg mx-auto lg:mx-0 leading-relaxed">
						4 kỹ năng. Thi thử chuẩn format. AI chấm bài theo rubric Bộ Giáo dục. Theo dõi tiến độ mỗi ngày.
					</p>
					<div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
						<Link to="/" search={{ auth: "register" }} className="btn btn-primary text-base px-10 py-3.5">
							Bắt đầu miễn phí
						</Link>
						<Link
							to="/"
							search={{ auth: "login" }}
							className="btn btn-secondary text-primary text-base px-10 py-3.5"
						>
							Đã có tài khoản
						</Link>
					</div>
				</div>

				{/* Right — mascot */}
				<div className="relative shrink-0 w-72 h-72 lg:w-80 lg:h-80 flex items-center justify-center">
					<img
						src="/mascot/lac-hero.png"
						alt="Lạc - Mascot VSTEP"
						className="w-56 lg:w-64 object-contain relative z-10"
					/>
					<FloatingBadge pos="-top-3 -right-3" delay="0s">
						<StaticIcon name="streak-sm" size="sm" />
						<span className="text-xs font-extrabold text-foreground">7 ngày</span>
					</FloatingBadge>
					<FloatingBadge pos="-bottom-2 -left-6" delay="0.6s">
						<StaticIcon name="trophy" size="sm" />
						<span className="text-xs font-extrabold text-foreground">B2!</span>
					</FloatingBadge>
					<FloatingBadge pos="top-1/3 -left-10" delay="1.2s">
						<StaticIcon name="coin" size="sm" />
						<span className="text-xs font-extrabold text-foreground">+100</span>
					</FloatingBadge>
					<FloatingBadge pos="-bottom-4 right-2" delay="1.8s">
						<Icon name="check" size="xs" className="text-primary" />
						<span className="text-xs font-extrabold text-primary">4 skills</span>
					</FloatingBadge>
				</div>
			</div>
		</section>
	)
}

function FloatingBadge({ pos, delay, children }: { pos: string; delay: string; children: React.ReactNode }) {
	return (
		<div
			className={`absolute ${pos} card px-3 py-2 flex items-center gap-1.5 shadow-md z-20`}
			style={{ animation: `float 3s ease-in-out ${delay} infinite` }}
		>
			{children}
		</div>
	)
}

export function LandingSkills() {
	return (
		<section className="bg-background py-20">
			<div className="max-w-6xl mx-auto px-8">
				<div className="text-center mb-12">
					<h2 className="font-extrabold text-3xl md:text-4xl text-foreground">
						4 kỹ năng theo chuẩn <span className="text-primary">VSTEP</span>
					</h2>
					<p className="text-muted mt-3 max-w-md mx-auto">
						Luyện đầy đủ Nghe - Đọc - Viết - Nói theo đúng format Bộ Giáo dục.
					</p>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
					<SkillCard
						icon="volume"
						label="Nghe"
						color="var(--color-skill-listening)"
						details={["3 phần nghe hiểu", "Hỗ trợ nghe lại 2 lần", "Đề thi chuẩn VSTEP"]}
					/>
					<SkillCard
						icon="book"
						label="Đọc"
						color="var(--color-skill-reading)"
						details={["4 đoạn văn · 40 câu", "Tra từ khi bôi đen", "Dịch tự động bằng AI"]}
					/>
					<SkillCard
						icon="pencil"
						label="Viết"
						color="var(--color-skill-writing)"
						details={["Thư + bài luận", "AI chấm theo rubric", "Bài mẫu + phân tích"]}
					/>
					<SkillCard
						icon="mic"
						label="Nói"
						color="var(--color-skill-speaking)"
						details={["3 phần theo format", "Ghi âm trực tiếp", "AI chấm phát âm + nội dung"]}
					/>
				</div>
			</div>
		</section>
	)
}

interface SkillCardProps {
	icon: IconName
	label: string
	color: string
	details: string[]
}

function SkillCard({ icon, label, color, details }: SkillCardProps) {
	return (
		<div className="card p-6 group hover:scale-[1.02] transition-transform">
			<div className="flex items-center gap-3 mb-4">
				<Icon name={icon} size="md" style={{ color }} />
				<h3 className="font-extrabold text-lg text-foreground">{label}</h3>
			</div>
			<ul className="space-y-2">
				{details.map((d) => (
					<li key={d} className="flex items-start gap-2 text-sm text-muted">
						<svg viewBox="0 0 20 20" fill={color} className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true">
							<path
								fillRule="evenodd"
								d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
								clipRule="evenodd"
							/>
						</svg>
						{d}
					</li>
				))}
			</ul>
		</div>
	)
}

export function LandingFeatures() {
	return (
		<section className="py-20">
			<div className="max-w-6xl mx-auto px-8">
				<div className="text-center mb-14">
					<h2 className="font-extrabold text-3xl md:text-4xl text-foreground">
						Tại sao chọn <span className="text-primary">VSTEP</span>?
					</h2>
					<p className="text-muted mt-3 max-w-md mx-auto">
						Nền tảng duy nhất kết hợp AI + format chuẩn Bộ Giáo dục cho kỳ thi VSTEP.
					</p>
				</div>

				<div className="space-y-6">
					{/* Row 1 — Thi thu + Luyen tap */}
					<div className="grid md:grid-cols-2 gap-6">
						<div className="card p-8 flex gap-6 items-start">
							<div className="w-14 h-14 shrink-0 flex items-center justify-center">
								<StaticIcon name="target-md" size="lg" />
							</div>
							<div>
								<h3 className="font-extrabold text-lg text-foreground">Thi thử chuẩn VSTEP</h3>
								<p className="text-sm text-muted mt-2 leading-relaxed">
									Đề thi từ ngân hàng đề HNUE, Văn Lang. Timer server đếm ngược chính xác. Format chuẩn Bộ GD&DT.
								</p>
								<div className="flex gap-4 mt-4">
									<span className="text-xs font-bold text-primary bg-primary-tint px-2.5 py-1 rounded-full">50+ đề thi</span>
									<span className="text-xs font-bold text-primary bg-primary-tint px-2.5 py-1 rounded-full">Timer server</span>
								</div>
							</div>
						</div>
						<div className="card p-8 flex gap-6 items-start">
							<div className="w-14 h-14 shrink-0 flex items-center justify-center">
								<StaticIcon name="streak-md" size="lg" />
							</div>
							<div>
								<h3 className="font-extrabold text-lg text-foreground">Luyện tập mỗi ngày</h3>
								<p className="text-sm text-muted mt-2 leading-relaxed">
									Từ vựng SRS nhớ lâu, ngữ pháp theo level, 4 kỹ năng với chế độ hỗ trợ thông minh.
								</p>
								<div className="flex gap-4 mt-4">
									<span className="text-xs font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full">SRS algorithm</span>
									<span className="text-xs font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full">Streak system</span>
								</div>
							</div>
						</div>
					</div>
					{/* Row 2 — AI full width */}
					<div className="card p-8 md:flex gap-8 items-center border-primary/20 bg-primary-tint/20">
						<div className="flex-1">
							<h3 className="font-extrabold text-xl text-foreground">AI chấm bài chi tiết</h3>
							<p className="text-sm text-muted mt-2 leading-relaxed max-w-lg">
								Phân tích điểm mạnh, cần cải thiện, gợi ý viết lại từng câu. Chấm theo rubric chính thức của Bộ GD&DT.
							</p>
							<div className="flex flex-wrap gap-3 mt-5">
								<span className="text-xs font-bold text-primary bg-primary-tint px-3 py-1.5 rounded-full">Strengths</span>
								<span className="text-xs font-bold text-primary bg-primary-tint px-3 py-1.5 rounded-full">Improvements</span>
								<span className="text-xs font-bold text-primary bg-primary-tint px-3 py-1.5 rounded-full">Rewrites</span>
								<span className="text-xs font-bold text-primary bg-primary-tint px-3 py-1.5 rounded-full">Rubric scoring</span>
							</div>
						</div>
						<div className="shrink-0 mt-6 md:mt-0">
							<img src="/mascot/lac-think.png" alt="" className="w-32 h-32 object-contain mx-auto" />
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}

export function LandingSocial() {
	return (
		<section className="bg-background py-20">
			<div className="max-w-6xl mx-auto px-8">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
					<div>
						<h2 className="font-extrabold text-3xl md:text-4xl text-foreground">
							Học viên nói gì?
						</h2>
						<p className="text-muted mt-2">Hơn 2,000 học viên đã đạt mục tiêu cùng VSTEP.</p>
					</div>
					<div className="flex items-center gap-3 shrink-0">
						<div className="flex items-center gap-0.5">
							{[1, 2, 3, 4, 5].map((s) => (
								<svg key={s} viewBox="0 0 20 20" fill="var(--color-warning)" className="w-5 h-5" aria-hidden="true">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
								</svg>
							))}
						</div>
						<span className="text-xl font-extrabold text-foreground">4.8/5</span>
					</div>
				</div>

				<div className="grid md:grid-cols-3 gap-5">
					<TestimonialCard
						text="Nhờ VSTEP mà mình đạt B2 chỉ sau 3 tháng ôn thi. AI chấm bài writing rất chi tiết!"
						name="Minh Anh"
						subtitle="SV Bách Khoa HCM"
						avatar="/mascot/lac-happy.png"
						color="var(--color-skill-reading)"
					/>
					<TestimonialCard
						text="Phần thi thử giống format thật 95%. Mình quen tay nên vào phòng thi rất tự tin."
						name="Hoàng Nam"
						subtitle="SV Kinh tế Quốc dân"
						avatar="/mascot/lac-speak.png"
						color="var(--color-skill-listening)"
					/>
					<TestimonialCard
						text="Streak system giúp mình duy trì thói quen học mỗi ngày. Không bỏ cuộc được!"
						name="Thu Hà"
						subtitle="SV Ngoại thương"
						avatar="/mascot/lac-read.png"
						color="var(--color-skill-writing)"
					/>
				</div>
			</div>
		</section>
	)
}

interface TestimonialProps {
	text: string
	name: string
	subtitle: string
	avatar: string
	color: string
}

function TestimonialCard({ text, name, subtitle, avatar, color }: TestimonialProps) {
	return (
		<div className="card p-6">
			<div className="flex items-center gap-3 mb-4">
				<div
					className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
					style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
				>
					<img src={avatar} alt="" className="w-8 h-8 object-contain" />
				</div>
				<div>
					<p className="text-sm font-bold text-foreground">{name}</p>
					<p className="text-xs text-muted">{subtitle}</p>
				</div>
			</div>
			<p className="text-sm text-foreground/80 leading-relaxed">"{text}"</p>
		</div>
	)
}

export function LandingCTA() {
	return (
		<section className="py-20">
			<div className="max-w-3xl mx-auto px-8 text-center">
				<img src="/mascot/lac-happy.png" alt="" className="w-24 h-24 object-contain mx-auto mb-5" />
				<h2 className="font-extrabold text-3xl md:text-4xl text-foreground mb-3">
					Sẵn sàng đạt mục tiêu?
				</h2>
				<p className="text-muted text-lg mb-8 max-w-md mx-auto">
					Đăng ký miễn phí, nhận 100 xu, bắt đầu luyện tập ngay hôm nay.
				</p>
				<Link to="/" search={{ auth: "register" }} className="btn btn-primary text-base px-12 py-4">
					Bắt đầu miễn phí
				</Link>
			</div>
		</section>
	)
}
