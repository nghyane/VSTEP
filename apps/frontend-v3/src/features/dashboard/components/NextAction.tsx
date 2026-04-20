import { useQuery } from "@tanstack/react-query"
import { Icon } from "#/components/Icon"
import { overviewQuery } from "#/features/dashboard/queries"
import { skills } from "#/lib/skills"
import { getTargetBand } from "#/lib/vstep"

function selectNextAction(raw: {
	data: {
		stats: { streak: number }
		chart: {
			listening: number | null
			reading: number | null
			writing: number | null
			speaking: number | null
		} | null
		profile: { target_level: string | null }
	}
}) {
	const { stats, chart, profile } = raw.data
	const targetBand = getTargetBand(profile.target_level)

	let weakest = skills[0]
	if (chart) {
		let minGap = Number.POSITIVE_INFINITY
		for (const s of skills) {
			const score = chart[s.key] ?? 0
			const gap = score - targetBand
			if (gap < minGap) {
				minGap = gap
				weakest = s
			}
		}
	}

	return { streak: stats.streak, skill: weakest }
}

export function NextAction() {
	const { data } = useQuery({ ...overviewQuery, select: selectNextAction })
	if (!data) return null

	return (
		<section className="card p-5 flex items-center gap-5">
			<Icon name="weights" size="lg" />
			<div className="flex-1 min-w-0">
				<h4 className="font-bold text-base text-foreground">Bạn chưa luyện tập hôm nay!</h4>
				<p className="text-sm text-subtle mt-0.5">
					Gợi ý: Luyện {data.skill.label} · 15 phút · Giữ streak {data.streak + 1} ngày
				</p>
			</div>
			<button type="button" className="btn btn-primary shrink-0">
				Bắt đầu
			</button>
		</section>
	)
}
