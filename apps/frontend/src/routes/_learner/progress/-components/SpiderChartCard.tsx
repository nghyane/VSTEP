import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { SpiderChart } from "@/components/common/SpiderChart"
import type { useSpiderChart } from "@/hooks/use-progress"
import { cn } from "@/lib/utils"
import { SKILLS, skillColorText } from "./progress-constants"

export function SpiderChartCard({
	spiderData,
}: {
	spiderData: ReturnType<typeof useSpiderChart>["data"]
}) {
	const spiderSkills = spiderData
		? SKILLS.map(({ key, label }) => ({
				label,
				value: spiderData.skills[key]?.current ?? 0,
				color: skillColorText[key],
			}))
		: []

	if (spiderSkills.length === 0) return null

	return (
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="text-lg font-semibold">Điểm trung bình theo kỹ năng</h3>
			<p className="mb-4 text-sm text-muted-foreground">trong Test Practice</p>
			<div className="flex justify-center">
				<SpiderChart skills={spiderSkills} className="size-64" />
			</div>
			<div className="mt-4 grid grid-cols-2 gap-2">
				{SKILLS.map(({ key, label, icon }) => (
					<Link
						key={key}
						to="/progress/$skill"
						params={{ skill: key }}
						className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted/50 transition-colors"
					>
						<HugeiconsIcon icon={icon} className={cn("size-4", skillColorText[key])} />
						<span>{label}</span>
						<span className="ml-auto text-xs text-muted-foreground tabular-nums">
							{spiderData?.skills[key]?.current?.toFixed(1) ?? "—"}
						</span>
					</Link>
				))}
			</div>
		</div>
	)
}
