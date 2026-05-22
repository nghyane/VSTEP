import { useState } from "react"
import { inputClass } from "#/features/auth/styles"
import { cn } from "#/lib/utils"

interface Props {
	id: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	autoComplete?: string
	required?: boolean
}

export function PasswordInput({ id, value, onChange, placeholder, autoComplete, required }: Props) {
	const [visible, setVisible] = useState(false)

	return (
		<div className="relative">
			<input
				id={id}
				type={visible ? "text" : "password"}
				placeholder={placeholder}
				required={required}
				autoComplete={autoComplete}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={cn(inputClass, "pr-12")}
			/>
			<button
				type="button"
				onClick={() => setVisible((v) => !v)}
				aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
				tabIndex={-1}
				className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded text-muted hover:text-foreground transition"
			>
				{visible ? <EyeOffIcon /> : <EyeIcon />}
			</button>
		</div>
	)
}

function EyeIcon() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	)
}

function EyeOffIcon() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M9.88 4.24A10.5 10.5 0 0 1 12 4c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.36 4.36" />
			<path d="M6.6 6.6A17.5 17.5 0 0 0 2 11s3.5 7 10 7c1.6 0 3.06-.32 4.34-.86" />
			<path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" />
			<path d="m3 3 18 18" />
		</svg>
	)
}
