import { Search } from "lucide-react"

interface ExamSidebarFiltersProps {
	searchQuery: string
	onSearchChange: (query: string) => void
}

export function ExamSidebarFilters({ searchQuery, onSearchChange }: ExamSidebarFiltersProps) {
	return (
		<aside className="sticky top-[88px] w-full shrink-0 space-y-8 md:w-64">
			<div className="space-y-3">
				<h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
					TÌM KIẾM
				</h3>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Nhập tên đề thi..."
						className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>
			</div>

			<div className="space-y-3">
				<h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
					TRẠNG THÁI
				</h3>
				<div className="space-y-2.5">
					{["Tất cả", "Chưa làm", "Đang làm dở", "Đã nộp"].map((status) => (
						<label
							key={status}
							className="flex cursor-pointer items-center gap-3 text-sm font-medium hover:text-primary transition-colors"
						>
							<input
								type="radio"
								name="status"
								className="size-4 accent-primary cursor-pointer"
								defaultChecked={status === "Tất cả"}
							/>
							{status}
						</label>
					))}
				</div>
			</div>

			<div className="space-y-3">
				<h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
					KỸ NĂNG
				</h3>
				<div className="space-y-2.5">
					{["Tất cả", "Listening", "Reading", "Writing", "Speaking"].map((skill) => (
						<label
							key={skill}
							className="flex cursor-pointer items-center gap-3 text-sm font-medium hover:text-primary transition-colors"
						>
							<input
								type="checkbox"
								className="size-4 rounded border-gray-300 accent-primary cursor-pointer"
								defaultChecked={skill === "Tất cả"}
							/>
							{skill}
						</label>
					))}
				</div>
			</div>
		</aside>
	)
}
