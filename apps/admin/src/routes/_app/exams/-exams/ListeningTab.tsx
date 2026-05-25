import { Collapse, Flex, Tag, Typography } from "antd"
import type { ListeningSection } from "#/features/admin-exams/types"

interface Props {
	sections: ListeningSection[]
}

export function ListeningTab({ sections }: Props) {
	if (sections.length === 0) {
		return <Typography.Text type="secondary">Chưa có nội dung Listening.</Typography.Text>
	}

	const items = sections.map((s) => ({
		key: s.id,
		label: (
			<Flex gap={8} align="center">
				<Tag>Part {s.part}</Tag>
				<Typography.Text>{s.part_title ?? `Section ${s.display_order + 1}`}</Typography.Text>
				<Typography.Text type="secondary">({s.items.length} câu)</Typography.Text>
			</Flex>
		),
		children: (
			<Flex vertical gap={8}>
				{s.audio_url && <Typography.Text type="secondary">Audio: {s.audio_url}</Typography.Text>}
				{s.items.map((item, idx) => (
					<Flex key={item.id} gap={8}>
						<Typography.Text strong>{idx + 1}.</Typography.Text>
						<Flex vertical>
							<Typography.Text>{item.stem}</Typography.Text>
							<Flex gap={4} wrap>
								{item.options.map((opt, oi) => (
									<Tag key={oi} color={oi === item.correct_index ? "green" : "default"}>
										{String.fromCharCode(65 + oi)}. {opt}
									</Tag>
								))}
							</Flex>
						</Flex>
					</Flex>
				))}
			</Flex>
		),
	}))

	return <Collapse items={items} defaultActiveKey={[sections[0]?.id]} />
}
