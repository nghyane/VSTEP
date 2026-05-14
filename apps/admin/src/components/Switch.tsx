import { cn } from "#/lib/utils"

interface Props {
	checked: boolean
	onChange: (value: boolean) => void
	disabled?: boolean
	label?: string
	id?: string
}

export function Switch({ checked, onChange, disabled, label, id }: Props) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"inline-flex items-center gap-2",
				disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
			)}
		>
			<button
				id={id}
				type="button"
				role="switch"
				aria-checked={checked}
				disabled={disabled}
				onClick={() => onChange(!checked)}
				className={cn(
					"relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
					"focus-visible:outline-2 focus-visible:outline-offset-2",
					checked ? "bg-primary" : "bg-border-strong",
				)}
			>
				<span
					className={cn(
						"inline-block h-4 w-4 transform rounded-full bg-surface shadow transition-transform",
						checked ? "translate-x-4" : "translate-x-0.5",
					)}
				/>
			</button>
			{label && <span className="text-sm text-foreground">{label}</span>}
		</label>
	)
}
