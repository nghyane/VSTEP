// StructurePhrasesList — danh sách cấu trúc câu theo target level. Click để copy.

import { Copy } from "lucide-react"
import { toast } from "sonner"
import type { TargetLevel } from "#/lib/practice/writing-structures"
import { WRITING_STRUCTURES } from "#/lib/practice/writing-structures"

interface Props {
	level: TargetLevel
}

export function StructurePhrasesList({ level }: Props) {
	const structures = WRITING_STRUCTURES[level]
	return (
		<ul className="space-y-2">
			{structures.map((s) => (
				<li key={s.id} data-structure-id={s.id}>
					<button
						type="button"
						onClick={() => {
							if (navigator.clipboard) {
								void navigator.clipboard.writeText(s.example)
								toast.success("Đã copy ví dụ vào clipboard")
							}
						}}
						className="group flex w-full flex-col items-start gap-1 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted"
					>
						<div className="flex w-full items-center justify-between gap-2">
							<code className="text-xs font-mono font-semibold text-primary">{s.pattern}</code>
							<Copy className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
						</div>
						<p className="text-xs italic text-foreground/80">{s.example}</p>
						<p className="text-[11px] text-muted-foreground">{s.vietnamese}</p>
					</button>
				</li>
			))}
		</ul>
	)
}
