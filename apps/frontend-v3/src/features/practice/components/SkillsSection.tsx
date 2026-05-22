import { Link } from "@tanstack/react-router"
import { SkillIcon } from "#/components/SkillIcon"
import { skills } from "#/lib/skills"

export function SkillsSection() {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Kỹ năng</h3>
			<p className="text-sm text-subtle mb-5">Luyện 4 kỹ năng VSTEP · bật/tắt hỗ trợ tùy nhu cầu</p>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{skills.map((s) => (
					<Link key={s.key} to={s.route} className="card-interactive p-5">
						<SkillIcon name={s.pngIcon} size="lg" className="mb-3" />
						<h4 className="font-bold text-base text-foreground">{s.label}</h4>
						<p className="text-xs text-subtle mt-0.5">{s.en}</p>
						<p className="text-sm text-muted mt-2">{s.desc}</p>
					</Link>
				))}
			</div>
		</section>
	)
}
