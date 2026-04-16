import { Label } from "#/components/ui/label"
import { Switch } from "#/components/ui/switch"
import { setSupportMode } from "#/lib/practice/support-mode"
import { useSupportMode } from "#/lib/practice/use-support-mode"

export function SupportModeSwitch() {
	const enabled = useSupportMode()

	return (
		<div className="inline-flex items-center gap-2">
			<Label htmlFor="support-mode" className="cursor-pointer text-xs font-medium text-muted-foreground select-none">
				Hỗ trợ
			</Label>
			<Switch
				id="support-mode"
				checked={enabled}
				onCheckedChange={setSupportMode}
				aria-label="Bật/tắt chế độ hỗ trợ"
			/>
		</div>
	)
}
