import { Search } from "lucide-react"

export function ExamSidebarFilters() {
	return (
		<aside className="w-full shrink-0 space-y-6 md:w-64">
			<div className="space-y-3">
				<h3 className="text-sm font-semibold text-muted-foreground">TÌM KIẾM</h3>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Nhập tên đề thi..."
						className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>
			</div>

			<div className="space-y-3">
				<h3 className="text-sm font-semibold text-muted-foreground">TRẠNG THÁI</h3>
				<div className="space-y-2">
					{["Tất cả", "Chưa làm", "Đang làm", "Đã nộp"].map((status) => (
						<label key={status} className="flex items-center gap-2 text-sm">
							<input
								type="radio"
								name="status"
								className="size-4"
								defaultChecked={status === "Tất cả"}
							/>
							{status}
						</label>
					))}
				</div>
			</div>

			<div className="space-y-3">
				<h3 className="text-sm font-semibold text-muted-foreground">KỸ NĂNG</h3>
				<div className="space-y-2">
					{["Tất cả", "Listening", "Reading", "Writing", "Speaking"].map((skill) => (
						<label key={skill} className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								className="size-4 rounded border-gray-300"
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
