import { Collapse, Flex, Tag, Typography } from "antd"
import type { ReadingPassage } from "#/features/admin-exams/types"

interface Props {
	passages: ReadingPassage[]
}

export function ReadingTab({ passages }: Props) {
	if (passages.length === 0) {
		return <Typography.Text type="secondary">Chưa có nội dung Reading.</Typography.Text>
	}

	const items = passages.map((p) => ({
		key: p.id,
		label: (
			<Flex gap={8} align="center">
				<Tag>Part {p.part}</Tag>
				<Typography.Text>{p.title ?? `Passage ${p.display_order + 1}`}</Typography.Text>
				<Typography.Text type="secondary">({p.items.length} câu)</Typography.Text>
			</Flex>
		),
		children: (
			<Flex vertical gap={12}>
				<Typography.Paragraph
					ellipsis={{ rows: 4, expandable: true, symbol: "Xem thêm" }}
					style={{ whiteSpace: "pre-wrap" }}
				>
					{p.passage}
				</Typography.Paragraph>
				{p.items.map((item, idx) => (
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

	return <Collapse items={items} defaultActiveKey={[passages[0]?.id]} />
}
