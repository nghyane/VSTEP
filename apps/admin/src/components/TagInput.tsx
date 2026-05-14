import { X } from "lucide-react"
import { type KeyboardEvent, useState } from "react"
import { cn } from "#/lib/utils"

interface Props {
	value: string[]
	onChange: (value: string[]) => void
	placeholder?: string
	disabled?: boolean
	invalid?: boolean
	/** Khi set, chỉ accept giá trị trong list này (case-insensitive). */
	allowed?: string[]
}

export function TagInput({ value, onChange, placeholder, disabled, invalid, allowed }: Props) {
	const [draft, setDraft] = useState("")

	function add(raw: string) {
		const t = raw.trim()
		if (!t) return
		if (allowed && !allowed.some((a) => a.toLowerCase() === t.toLowerCase())) return
		if (value.includes(t)) {
			setDraft("")
			return
		}
		onChange([...value, t])
		setDraft("")
	}

	function remove(tag: string) {
		onChange(value.filter((t) => t !== tag))
	}

	function onKey(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault()
			add(draft)
		} else if (e.key === "Backspace" && draft === "" && value.length > 0) {
			remove(value[value.length - 1])
		}
	}

	return (
		<div
			className={cn(
				"flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-(--radius-input) border bg-surface px-2 py-1.5",
				"focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
				invalid ? "border-danger" : "border-border",
				disabled && "bg-surface-muted opacity-60",
			)}
		>
			{value.map((tag) => (
				<span
					key={tag}
					className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-xs text-foreground"
				>
					{tag}
					{!disabled && (
						<button
							type="button"
							aria-label={`Xoá ${tag}`}
							onClick={() => remove(tag)}
							className="text-muted hover:text-danger"
						>
							<X className="size-3" />
						</button>
					)}
				</span>
			))}
			<input
				type="text"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={onKey}
				onBlur={() => draft && add(draft)}
				disabled={disabled}
				placeholder={value.length === 0 ? placeholder : undefined}
				className="min-w-[80px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
			/>
		</div>
	)
}
