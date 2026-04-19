import streakIcon from "#/assets/icons/streak-medium.svg"
import targetIcon from "#/assets/icons/target-medium.svg"
import timerIcon from "#/assets/icons/timer-medium.svg"
import trophyIcon from "#/assets/icons/trophy-small.svg"

const STATS = [
	{ icon: streakIcon, label: "Streak hiện tại", value: "7 ngày" },
	{ icon: timerIcon, label: "Thời gian luyện tập", value: "7h 20m" },
	{ icon: targetIcon, label: "Bài thi thử", value: "3", suffix: "/ 5" },
	{ icon: trophyIcon, label: "Band ước tính", value: "—", empty: "Cần 5 bài thi" },
]

export function StatsRow() {
	return (
		<section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{STATS.map((s) => (
				<div key={s.label} className="card p-4">
					<div className="flex items-center gap-3">
						<img src={s.icon} className="w-10 h-10 object-contain" alt="" />
						<div className="min-w-0">
							<p className="text-sm text-subtle">{s.label}</p>
							<p className={`font-extrabold text-2xl ${s.value === "—" ? "text-subtle" : "text-foreground"}`}>
								{s.value}
								{s.suffix && <span className="text-sm text-subtle font-normal"> {s.suffix}</span>}
							</p>
							{s.empty && s.value === "—" && <p className="text-xs text-placeholder">{s.empty}</p>}
						</div>
					</div>
				</div>
			))}
		</section>
	)
}
