import { Crown, Search } from "lucide-react"
import { useState } from "react"

type ExamType = "all" | "pro" | "free"

export function ExamSidebarFilters() {
	const [selectedType, setSelectedType] = useState<ExamType>("free")

	return (
		<aside className="sticky top-[88px] w-full shrink-0 space-y-8 md:w-64">
			<div className="space-y-3">
				<h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
					LOẠI ĐỀ THI
				</h3>
				<div className="flex w-full items-center justify-between rounded-full bg-slate-100 p-1">
					<button
						type="button"
						onClick={() => setSelectedType("all")}
						className={`flex flex-1 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
							selectedType === "all"
								? "bg-white text-primary shadow-sm"
								: "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
						}`}
					>
						Tất cả
					</button>
					<button
						type="button"
						onClick={() => setSelectedType("pro")}
						className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
							selectedType === "pro"
								? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm ring-1 ring-amber-500/50"
								: "text-slate-500 hover:text-amber-600 hover:bg-slate-200/50"
						}`}
					>
						<Crown className="size-3.5" />
						Pro
					</button>
					<button
						type="button"
						onClick={() => setSelectedType("free")}
						className={`flex flex-1 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
							selectedType === "free"
								? "bg-white text-primary shadow-sm"
								: "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
						}`}
					>
						Miễn phí
					</button>
				</div>
			</div>

			<div className="space-y-3">
				<h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
					TÌM KIẾM
				</h3>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
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
