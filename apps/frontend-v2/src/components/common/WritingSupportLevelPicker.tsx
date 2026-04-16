// WritingSupportLevelPicker — nút tròn + popover chọn 1 trong 4 cấp hỗ trợ.

import { Check, Lightbulb } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover"
import {
	setWritingSupportLevel,
	WRITING_SUPPORT_LEVELS,
	type WritingSupportLevel,
} from "#/lib/practice/writing-support-level"
import { cn } from "#/lib/utils"

export function WritingSupportLevelPicker({ level }: { level: WritingSupportLevel }) {
	const current = WRITING_SUPPORT_LEVELS.find((l) => l.value === level)
	const isActive = level !== "off"

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={`Chế độ hỗ trợ: ${current?.label ?? "Tắt"}`}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
						isActive
							? "border-primary/30 bg-primary/5 text-primary"
							: "border-border bg-background text-muted-foreground hover:bg-muted",
					)}
				>
					<Lightbulb className="size-3.5" />
					{current?.label ?? "Tắt"}
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" side="bottom" className="w-64 p-1">
				<div className="px-2 py-1.5">
					<p className="text-xs font-semibold">Chế độ hỗ trợ</p>
					<p className="text-[11px] text-muted-foreground">Chọn mức hỗ trợ phù hợp</p>
				</div>
				<div className="flex flex-col">
					{WRITING_SUPPORT_LEVELS.map((opt) => {
						const active = opt.value === level
						return (
							<button
								key={opt.value}
								type="button"
								onClick={() => setWritingSupportLevel(opt.value)}
								className={cn(
									"flex items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
									active ? "bg-primary/5 text-primary" : "hover:bg-muted",
								)}
							>
								<Check
									className={cn("mt-0.5 size-4 shrink-0", active ? "opacity-100" : "opacity-0")}
								/>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium">{opt.label}</p>
									<p className="text-xs text-muted-foreground">{opt.description}</p>
								</div>
							</button>
						)
					})}
				</div>
			</PopoverContent>
		</Popover>
	)
}
