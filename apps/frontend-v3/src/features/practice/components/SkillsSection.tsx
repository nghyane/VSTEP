import { Link } from "@tanstack/react-router"
import { SKILL_CONFIG, type SkillKey } from "#/lib/skills"

// TODO: replace with API data from GET /api/v1/practice-progress
const MOCK_PROGRESS: Record<SkillKey, { total: number; completed: number; desc: string }> = {
	listening: { total: 20, completed: 12, desc: "Nghe hiểu · 3 phần" },
	reading: { total: 20, completed: 9, desc: "Đọc hiểu · 4 đoạn văn" },
	writing: { total: 20, completed: 6, desc: "Task 1 (thư) + Task 2 (luận)" },
	speaking: { total: 20, completed: 4, desc: "3 phần · ghi âm + AI chấm" },
}

const SKILL_KEYS: SkillKey[] = ["listening", "reading", "writing", "speaking"]

export function SkillsSection() {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Kỹ năng</h3>
			<p className="text-sm text-subtle mb-5">Luyện 4 kỹ năng VSTEP · bật/tắt hỗ trợ tùy nhu cầu</p>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{SKILL_KEYS.map((key) => {
					const config = SKILL_CONFIG[key]
					const data = MOCK_PROGRESS[key]
					const pct = Math.round((data.completed / data.total) * 100)

					return (
						<Link key={key} to={config.route} className="card-interactive p-5">
							<config.Icon className="h-10 w-auto mb-3" style={{ color: config.color }} />
							<h4 className="font-bold text-base text-foreground">{config.label}</h4>
							<p className="text-xs text-subtle mt-0.5">{config.en}</p>
							<p className="text-sm text-muted mt-2">{data.desc}</p>

							<div className="mt-4">
								<div className="flex items-center justify-between mb-1.5">
									<span className="text-xs text-subtle">{data.completed} bài</span>
									<span className="text-xs font-bold" style={{ color: config.color }}>
										{pct}%
									</span>
								</div>
								<div className="h-2 bg-border rounded-full overflow-hidden">
									<div
										className="h-full rounded-full transition-all"
										style={{ width: `${pct}%`, background: config.color }}
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
