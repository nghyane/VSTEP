import { setSupportMode } from "#/features/practice/lib/support-mode"
import { useSupportMode } from "#/features/practice/lib/use-support-mode"
import { Label } from "#/shared/ui/label"
import { Switch } from "#/shared/ui/switch"

export function SupportModeSwitch() {
	const enabled = useSupportMode()

	return (
		<div className="inline-flex items-center gap-2">
			<Label
				htmlFor="support-mode"
				className="cursor-pointer text-xs font-medium text-muted-foreground select-none"
			>
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
