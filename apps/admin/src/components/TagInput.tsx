import { Select } from "antd"
import { useMemo } from "react"

interface Props {
	value: string[]
	onChange: (value: string[]) => void
	placeholder?: string
	disabled?: boolean
	invalid?: boolean
	allowed?: string[]
}

export function TagInput({ value, onChange, placeholder, disabled, invalid, allowed }: Props) {
	const options = useMemo(
		() => (allowed ? allowed.map((a) => ({ value: a, label: a })) : undefined),
		[allowed],
	)
	const mode: "tags" | "multiple" = allowed ? "multiple" : "tags"

	function handleChange(next: string[]) {
		if (allowed) {
			const lc = allowed.map((a) => a.toLowerCase())
			const filtered = Array.from(new Set(next.filter((v) => lc.includes(v.toLowerCase()))))
			onChange(filtered)
		} else {
			onChange(Array.from(new Set(next.map((v) => v.trim()).filter(Boolean))))
		}
	}

	return (
		<Select
			mode={mode}
			value={value}
			onChange={handleChange}
			placeholder={placeholder}
			disabled={disabled}
			status={invalid ? "error" : undefined}
			style={{ width: "100%" }}
			options={options}
			tokenSeparators={[",", "\n"]}
		/>
	)
}
