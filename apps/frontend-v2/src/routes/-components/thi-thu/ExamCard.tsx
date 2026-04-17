import { Link } from "@tanstack/react-router"
import { Clock, Users } from "lucide-react"
import { Button } from "#/components/ui/button"
import { FULL_TEST_COST } from "#/lib/coins/coin-store"
import { cn } from "#/lib/utils"
import { EXAM_SKILLS } from "./exam-skill-meta"

interface ExamCardProps {
	id: number
}

export function ExamCard({ id }: ExamCardProps) {
	return (
		<div className="group relative h-full">
			<div className="absolute inset-0 translate-x-[4px] translate-y-[4px] rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 transition-transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]" />

			<div className="relative flex h-full flex-col justify-between rounded-xl border border-border bg-background p-4 transition-all group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] group-hover:shadow-md">
				<div>
					<h3 className="line-clamp-2 text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
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

					<div className="mt-4 flex flex-nowrap items-center gap-2.5 overflow-x-auto pb-1">
						{EXAM_SKILLS.map((skill) => (
							<span
								key={skill.key}
								className={cn(
									"inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
									skill.chipClass,
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
						<span className="inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-gradient-to-r from-amber-400 to-amber-500 px-3 text-white shadow-sm">
							<span className="flex size-5 shrink-0 items-center justify-center">
								<img
									src="/image.png"
									alt=""
									aria-hidden="true"
									className="block size-5 shrink-0 object-contain -translate-y-px"
								/>
							</span>
							<span className="text-xs leading-none font-bold">{FULL_TEST_COST} xu</span>
						</span>
						<Button size="sm" className="font-medium" asChild>
							<Link to="/thi-thu/$examId" params={{ examId: String(id) }}>
								Xem đề
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
