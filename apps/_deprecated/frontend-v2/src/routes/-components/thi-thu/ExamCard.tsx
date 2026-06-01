import { Link } from "@tanstack/react-router"
import { Clock, Users } from "lucide-react"
import { FULL_TEST_COST } from "#/features/coin/lib/coin-store"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { EXAM_SKILLS } from "./exam-skill-meta"

interface ExamCardProps {
	id: number
}

export function ExamCard({ id }: ExamCardProps) {
	return (
		<div className="flex h-full flex-col justify-between rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5 transition-all hover:shadow-md">
			<div>
				<h3 className="line-clamp-2 text-lg font-semibold leading-tight text-foreground">
					Đề thi VSTEP HNUE 08/02/2026 #{id}
				</h3>

				<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<Clock className="size-4" /> 120 phút
					</span>
					<span className="flex items-center gap-1.5">
						<Users className="size-4" /> 1.2k lượt thi
					</span>
				</div>

				<div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
					{EXAM_SKILLS.map((skill) => (
						<span
							key={skill.key}
							className={cn(
								"inline-flex shrink-0 items-center gap-1 px-1 py-0.5 text-xs font-semibold whitespace-nowrap",
								skill.textClass,
							)}
						>
							{skill.label}
						</span>
					))}
				</div>

				<div className="mt-4 flex flex-wrap gap-2">
					<span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
						#FullTest
					</span>
					<span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
						#HNUE
					</span>
				</div>
			</div>

			<div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
				<span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
					Trạng thái:
					<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
						Chưa làm
					</span>
				</span>
				<div className="flex items-center gap-2">
					<span className="inline-flex h-7 items-center gap-1.5 px-1 text-sm">
						<img
							src="/image.png"
							alt=""
							aria-hidden="true"
							className="block size-5 shrink-0 object-contain"
						/>
						<span className="text-xs font-bold text-amber-600">{FULL_TEST_COST} xu</span>
					</span>
					<Button size="sm" className="font-medium" asChild>
						<Link to="/thi-thu/$examId" params={{ examId: String(id) }}>
							Xem đề
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
