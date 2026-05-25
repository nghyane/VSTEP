import { Flex, Tag, Typography } from "antd"
import { Card } from "#/components/Card"
import type { SpeakingPart } from "#/features/admin-exams/types"

interface Props {
	parts: SpeakingPart[]
}

export function SpeakingTab({ parts }: Props) {
	if (parts.length === 0) {
		return <Typography.Text type="secondary">Chưa có nội dung Speaking.</Typography.Text>
	}

	return (
		<Flex vertical gap={16}>
			{parts.map((p) => (
				<Card key={p.id} title={`Part ${p.part} — ${p.type}`}>
					<Flex vertical gap={8}>
						<Flex gap={8}>
							{p.duration_minutes && <Tag>Thời gian: {p.duration_minutes} phút</Tag>}
							{p.speaking_seconds && <Tag>Nói: {p.speaking_seconds}s</Tag>}
						</Flex>
						<Typography.Text code style={{ whiteSpace: "pre-wrap" }}>
							{JSON.stringify(p.content, null, 2)}
						</Typography.Text>
					</Flex>
				</Card>
			))}
		</Flex>
	)
}
