import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import type { BackLink } from "#/features/vocab/types"

interface Props extends BackLink {
	current: number
	total: number
}

export function FocusBar({ backTo, backParams, current, total }: Props) {
	return (
		<div className="flex items-center gap-4 px-6 py-4">
			<Link to={backTo} params={backParams} className="p-2 hover:opacity-70">
				<Icon name="close" size="sm" className="text-muted" />
			</Link>
			<div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
				<div
					className="h-full bg-primary rounded-full transition-all"
					style={{ width: `${total ? (current / total) * 100 : 0}%` }}
				/>
			</div>
			<span className="text-sm font-bold text-muted">
				{current}/{total}
			</span>
		</div>
	)
}
