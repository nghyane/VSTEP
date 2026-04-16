// SupportModeSwitch — toggle compact dùng ở header session page (Nghe/Đọc/Viết/Nói).
// Đọc/ghi qua lib/practice/support-mode, broadcast qua CustomEvent nên
// tất cả consumer `useSyncExternalStore` tự rerender.

import { Lightbulb } from "lucide-react"
import { Label } from "#/components/ui/label"
import { Switch } from "#/components/ui/switch"
import { setSupportMode } from "#/lib/practice/support-mode"
import { useSupportMode } from "#/lib/practice/use-support-mode"
import { cn } from "#/lib/utils"

const INPUT_ID = "session-support-mode"

export function SupportModeSwitch() {
	const enabled = useSupportMode()

	return (
		<div
			className={cn(
				"inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
				enabled ? "border-primary/30 bg-primary/5" : "border-border bg-background",
			)}
		>
			<Lightbulb className={cn("size-4", enabled ? "text-primary" : "text-muted-foreground")} />
			<Label htmlFor={INPUT_ID} className="cursor-pointer text-xs font-medium select-none">
				Chế độ hỗ trợ
			</Label>
			<Switch
				id={INPUT_ID}
				checked={enabled}
				onCheckedChange={setSupportMode}
				aria-label="Bật/tắt chế độ hỗ trợ"
			/>
		</div>
	)
}
