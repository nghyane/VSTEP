import { Link } from "@tanstack/react-router"
import { skills } from "#/lib/skills"

// TODO: replace with API data from GET /api/v1/practice-progress
const MOCK_PROGRESS: Record<string, { total: number; completed: number }> = {
	listening: { total: 20, completed: 12 },
	reading: { total: 20, completed: 9 },
	writing: { total: 20, completed: 6 },
	speaking: { total: 20, completed: 4 },
}

export function SkillsSection() {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Kỹ năng</h3>
			<p className="text-sm text-subtle mb-5">Luyện 4 kỹ năng VSTEP · bật/tắt hỗ trợ tùy nhu cầu</p>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{skills.map((s) => {
					const progress = MOCK_PROGRESS[s.key] ?? { total: 1, completed: 0 }
					const pct = Math.round((progress.completed / progress.total) * 100)
					return (
						<Link key={s.key} to={s.route} className="card-interactive p-5">
							<s.Icon className="h-10 w-auto mb-3" style={{ color: s.color }} />
							<h4 className="font-bold text-base text-foreground">{s.label}</h4>
							<p className="text-xs text-subtle mt-0.5">{s.en}</p>
							<p className="text-sm text-muted mt-2">{s.desc}</p>

							<div className="mt-4">
								<div className="flex items-center justify-between mb-1.5">
									<span className="text-xs text-subtle">{progress.completed} bài</span>
									<span className="text-xs font-bold" style={{ color: s.color }}>
										{pct}%
									</span>
								</div>
								<div className="h-2 bg-border rounded-full overflow-hidden">
									<div
										className="h-full rounded-full transition-all"
										style={{ width: `${pct}%`, background: s.color }}
									/>
								</div>
							</div>
						</Link>
					)
				})}
			</div>
		</section>
	)
}
