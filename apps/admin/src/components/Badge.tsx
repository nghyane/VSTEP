import { Tag } from "antd"
import type { HTMLAttributes } from "react"

type Variant = "default" | "success" | "warning" | "danger" | "info"

interface Props extends HTMLAttributes<HTMLSpanElement> {
	variant?: Variant
}

const colorMap: Record<Variant, string | undefined> = {
	default: undefined,
	success: "success",
	warning: "warning",
	danger: "error",
	info: "processing",
}

export function Badge({ variant = "default", className, children }: Props) {
	return (
		<Tag color={colorMap[variant]} className={className} style={{ marginInlineEnd: 0 }}>
			{children}
		</Tag>
	)
}
