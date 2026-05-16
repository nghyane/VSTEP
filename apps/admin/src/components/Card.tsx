import { Card as AntdCard } from "antd"
import type { HTMLAttributes, ReactNode } from "react"

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
	title?: ReactNode
	description?: string
	action?: ReactNode
	padded?: boolean
}

export function Card({ title, description, action, padded = true, className, children }: CardProps) {
	const header =
		title || description ? (
			<div>
				{title && <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>}
				{description && (
					<div style={{ marginTop: 4, fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{description}</div>
				)}
			</div>
		) : null

	return (
		<AntdCard
			className={className}
			title={header}
			extra={action}
			styles={{ body: { padding: padded ? 20 : 0 } }}
		>
			{children}
		</AntdCard>
	)
}
