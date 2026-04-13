import { BookOpen, Clock, Crown, Users } from "lucide-react"
import { Button } from "#/components/ui/button"

interface ExamCardProps {
	id: number
	isPro?: boolean
}

export function ExamCard({ id, isPro = false }: ExamCardProps) {
	return (
		<div className="group relative h-full">
			<div
				className={
					isPro
						? "absolute inset-0 translate-x-[4px] translate-y-[4px] rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 transition-transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]"
						: "absolute inset-0 translate-x-[4px] translate-y-[4px] rounded-xl bg-gradient-to-br from-slate-100 via-slate-200 to-blue-100 transition-transform group-hover:translate-x-[6px] group-hover:translate-y-[6px]"
				}
			/>

			<div className="relative flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] group-hover:shadow-md">
				<div>
					<div className="mb-2 flex items-end">
						{isPro ? (
							<span className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-0.5 text-white shadow-sm">
								<Crown className="mr-1 size-3.5" />
								<span className="translate-y-[1px] text-[10px] font-bold leading-none uppercase tracking-wider">
									Pro
								</span>
							</span>
						) : (
							<span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-600">
								<span className="text-[10px] font-semibold leading-none uppercase tracking-wider">
									Free
								</span>
							</span>
						)}
					</div>

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
						<span className="flex items-center gap-1.5">
							<BookOpen className="size-4" /> 4 kỹ năng
						</span>
					</div>

					<div className="mt-4 flex flex-wrap gap-2">
						<span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
							#FullTest
						</span>
						<span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
							#HNUE
						</span>
					</div>
				</div>

				<div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
					<span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
		</div>
	)
}
