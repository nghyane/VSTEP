import { Collapse, Flex, Tag, Typography } from "antd"
import type { ListeningSection } from "#/features/admin-exams/types"

interface Props {
	sections: ListeningSection[]
}

export function ListeningTab({ sections }: Props) {
	if (sections.length === 0) {
		return <Typography.Text type="secondary">Chưa có nội dung Listening.</Typography.Text>
	}

	// Group sections by part
	const grouped = new Map<number, ListeningSection[]>()
	for (const s of sections) {
		const list = grouped.get(s.part) ?? []
		list.push(s)
		grouped.set(s.part, list)
	}

	const partItems = Array.from(grouped.entries()).map(([part, partSections]) => {
		const totalQuestions = partSections.reduce((sum, s) => sum + s.items.length, 0)
		return {
			key: `part-${part}`,
			label: (
				<Flex gap={8} align="center">
					<Tag color="blue">Part {part}</Tag>
					<Typography.Text type="secondary">
						{partSections.length} đoạn · {totalQuestions} câu
					</Typography.Text>
				</Flex>
			),
			children: (
				<Flex vertical gap={16}>
					{partSections.map((s) => (
						<SectionBlock key={s.id} section={s} />
					))}
				</Flex>
			),
		}
	})

	return <Collapse items={partItems} defaultActiveKey={["part-1"]} />
}

function SectionBlock({ section: s }: { section: ListeningSection }) {
	return (
		<Flex vertical gap={8} style={{ paddingLeft: 8, borderLeft: "2px solid #f0f0f0" }}>
			<Flex gap={8} align="center">
				<Typography.Text strong>{s.part_title}</Typography.Text>
				<Typography.Text type="secondary">({s.items.length} câu)</Typography.Text>
			</Flex>
			{s.audio_url && (
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					Audio: {s.audio_url}
				</Typography.Text>
			)}
			{s.items.map((item, idx) => (
				<Flex key={item.id} gap={8} style={{ paddingLeft: 8 }}>
					<Typography.Text strong style={{ minWidth: 24 }}>
						{idx + 1}.
					</Typography.Text>
					<Flex vertical gap={4}>
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
	)
}
