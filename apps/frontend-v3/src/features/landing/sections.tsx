import { Icon, StaticIcon } from "#/components/Icon"
import { skills } from "#/lib/skills"

interface Props {
	onLogin: () => void
}

export function LandingHero({ onLogin }: Props) {
	return (
		<section className="max-w-6xl mx-auto px-8 pt-16 pb-20 flex flex-col items-center text-center">
			<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-tint text-primary text-sm font-bold mb-6">
				<Icon name="check" size="xs" />
				Miễn phí · 100 xu khi đăng ký
			</div>
			<h1 className="font-extrabold text-5xl md:text-6xl text-foreground leading-tight max-w-3xl">
				Luyện thi VSTEP đạt B2 với AI
			</h1>
			<p className="text-lg text-muted mt-5 max-w-xl">
				Luyện 4 kỹ năng. Thi thử chuẩn format. AI chấm bài theo rubric Bộ Giáo dục. Theo dõi tiến độ đến ngày
				thi.
			</p>
			<button type="button" onClick={onLogin} className="btn btn-primary text-base px-10 py-3.5 mt-8">
				Bắt đầu miễn phí
			</button>
		</section>
	)
}

export function LandingSkills() {
	return (
		<section className="max-w-6xl mx-auto px-8 pb-20">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{skills.map((s) => (
					<div key={s.key} className="card p-5 text-center">
						<Icon name={s.icon} size="lg" className="mx-auto mb-3" style={{ color: s.color }} />
						<h3 className="font-bold text-base text-foreground">{s.label}</h3>
						<p className="text-sm text-subtle mt-1">{s.desc}</p>
					</div>
				))}
			</div>
		</section>
	)
}

export function LandingFeatures() {
	return (
		<section className="bg-background py-20">
			<div className="max-w-6xl mx-auto px-8">
				<h2 className="font-extrabold text-3xl text-foreground text-center mb-12">Tại sao chọn VSTEP?</h2>
				<div className="grid md:grid-cols-3 gap-6">
					<div className="card p-6">
						<StaticIcon name="target-md" size="xl" className="mb-4" />
						<h3 className="font-bold text-lg text-foreground">Thi thử chuẩn VSTEP</h3>
						<p className="text-sm text-muted mt-2 leading-relaxed">
							Đề thi từ ngân hàng đề HNUE, Văn Lang. Timer server, format chuẩn Bộ GD.
						</p>
					</div>
					<div className="card p-6">
						<StaticIcon name="streak-md" size="xl" className="mb-4" />
						<h3 className="font-bold text-lg text-foreground">Luyện tập mỗi ngày</h3>
						<p className="text-sm text-muted mt-2 leading-relaxed">
							Từ vựng SRS, ngữ pháp theo level, 4 kỹ năng với chế độ hỗ trợ.
						</p>
					</div>
					<div className="card p-6">
						<StaticIcon name="trophy" size="xl" className="mb-4" />
						<h3 className="font-bold text-lg text-foreground">AI chấm bài chi tiết</h3>
						<p className="text-sm text-muted mt-2 leading-relaxed">
							Điểm mạnh → Cần cải thiện → Gợi ý viết lại. Theo rubric Bộ Giáo dục.
						</p>
					</div>
				</div>
			</div>
		</section>
	)
}

export function LandingCTA({ onLogin }: Props) {
	return (
		<section className="max-w-6xl mx-auto px-8 py-20 text-center">
			<h2 className="font-extrabold text-3xl text-foreground mb-4">Sẵn sàng đạt mục tiêu?</h2>
			<p className="text-muted text-lg mb-8">Đăng ký miễn phí, nhận 100 xu, bắt đầu luyện tập ngay.</p>
			<button type="button" onClick={onLogin} className="btn btn-primary text-base px-10 py-3.5">
				Đăng ký ngay
			</button>
		</section>
	)
}
