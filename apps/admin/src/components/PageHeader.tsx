import { Flex, Typography } from "antd"
import type { HTMLAttributes, ReactNode } from "react"

interface Props extends HTMLAttributes<HTMLDivElement> {
	title: string
	subtitle?: string
	action?: ReactNode
}

export function PageHeader({ title, subtitle, action, className, children }: Props) {
	return (
		<Flex className={className} justify="space-between" align="center" wrap="wrap" gap={12}>
			<div>
				<Typography.Title level={3} style={{ margin: 0 }}>
					{title}
				</Typography.Title>
				{subtitle && (
					<Typography.Text type="secondary" style={{ marginTop: 4, display: "block" }}>
						{subtitle}
					</Typography.Text>
				)}
			</div>
			{action}
			{children}
		</Flex>
	)
}
