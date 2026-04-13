import { BookOpen, Clock, Users } from "lucide-react"
import { Button } from "#/components/ui/button"

interface ExamCardProps {
	id: number
}

export function ExamCard({ id }: ExamCardProps) {
	return (
		<div className="group flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
			<div>
				<h3 className="line-clamp-2 text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
					Đề thi VSTEP HNUE 08/02/2026 #{id}
				</h3>

				{/* Meta info */}
				<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<Clock className="size-4" /> 120 phút
					</span>
					<span className="flex items-center gap-1.5">
						<Users className="size-4" /> 1.2k lượt thi
					</span>
					<span className="flex items-center gap-1.5">
						<BookOpen className="size-4" /> 4 kỹ năng
					</span>
				</div>

				{/* Tags */}
				<div className="mt-4 flex flex-wrap gap-2">
					<span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
						#FullTest
					</span>
					<span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
						#HNUE
					</span>
				</div>
			</div>

			{/* Footer action */}
			<div className="mt-5 flex items-center justify-between border-t pt-4">
				<span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
					Trạng thái:
					<span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
						Chưa làm
					</span>
				</span>
				<Button size="sm" className="font-medium">
					Vào thi
				</Button>
			</div>
		</div>
	)
}
