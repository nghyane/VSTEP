import { Collapse, Flex, Tag, Typography } from "antd"
import type { ReadingPassage } from "#/features/admin-exams/types"

interface Props {
	passages: ReadingPassage[]
	examId: string
	versionId: string
}

export function ReadingTab({ passages }: Props) {
	if (passages.length === 0) {
		return <Typography.Text type="secondary">Chưa có nội dung Reading.</Typography.Text>
	}

	// Group passages by part
	const grouped = new Map<number, ReadingPassage[]>()
	for (const p of passages) {
		const list = grouped.get(p.part) ?? []
		list.push(p)
		grouped.set(p.part, list)
	}

	const partItems = Array.from(grouped.entries()).map(([part, partPassages]) => {
		const totalQuestions = partPassages.reduce((sum, p) => sum + p.items.length, 0)
		return {
			key: `part-${part}`,
			label: (
				<Flex gap={8} align="center">
					<Tag color="blue">Part {part}</Tag>
					<Typography.Text type="secondary">
						{partPassages.length} bài · {totalQuestions} câu
					</Typography.Text>
				</Flex>
			),
			children: (
				<Flex vertical gap={16}>
					{partPassages.map((p) => (
						<PassageBlock key={p.id} passage={p} />
					))}
				</Flex>
			),
		}
	})

	return <Collapse items={partItems} defaultActiveKey={["part-1"]} />
}

function PassageBlock({ passage: p }: { passage: ReadingPassage }) {
	return (
		<Flex vertical gap={8} style={{ paddingLeft: 8, borderLeft: "2px solid #f0f0f0" }}>
			<Flex gap={8} align="center">
				<Typography.Text strong>{p.title}</Typography.Text>
				<Typography.Text type="secondary">({p.items.length} câu)</Typography.Text>
			</Flex>
			<Typography.Paragraph
				ellipsis={{ rows: 3, expandable: true, symbol: "Xem thêm" }}
				style={{ whiteSpace: "pre-wrap", margin: 0, color: "#595959" }}
			>
				{p.passage}
			</Typography.Paragraph>
			{p.items.map((item, idx) => (
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
