// SupportModeSwitch — toggle compact ở góc phải header, bật/tắt chế độ hỗ trợ.

import { Lightbulb } from "lucide-react"
import { setSupportMode } from "#/lib/practice/support-mode"
import { useSupportMode } from "#/lib/practice/use-support-mode"
import { cn } from "#/lib/utils"

export function SupportModeSwitch() {
	const enabled = useSupportMode()

	return (
		<button
			type="button"
			onClick={() => setSupportMode(!enabled)}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
				enabled
					? "border-primary/30 bg-primary/5 text-primary"
					: "border-border text-muted-foreground hover:text-foreground",
			)}
		>
			<Lightbulb className="size-3.5" />
			{enabled ? "Hỗ trợ: Bật" : "Hỗ trợ: Tắt"}
		</button>
	)
}
