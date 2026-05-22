import { Alert, Flex } from "antd"
import type { AlertItem } from "./types"

export function AlertsBanner({ alerts }: { alerts: AlertItem[] | undefined }) {
	if (!alerts || alerts.length === 0) return null
	const hasError = alerts.some((a) => a.type === "error")
	return (
		<Alert
			type={hasError ? "error" : "warning"}
			showIcon
			description={
				<Flex vertical gap={4}>
					{alerts.map((a, i) => (
						<span key={i}>{a.message}</span>
					))}
				</Flex>
			}
		/>
	)
}
