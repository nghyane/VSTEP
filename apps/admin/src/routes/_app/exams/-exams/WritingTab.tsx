import { Flex, Tag, Typography } from "antd"
import { Card } from "#/components/Card"
import type { WritingTask } from "#/features/admin-exams/types"

interface Props {
	tasks: WritingTask[]
	examId: string
	versionId: string
}

export function WritingTab({ tasks }: Props) {
	if (tasks.length === 0) {
		return <Typography.Text type="secondary">Chưa có nội dung Writing.</Typography.Text>
	}

	return (
		<Flex vertical gap={16}>
			{tasks.map((t) => (
				<Card key={t.id} title={`Part ${t.part} — ${t.task_type === "letter" ? "Thư" : "Bài luận"}`}>
					<Flex vertical gap={8}>
						<Flex gap={8}>
							{t.duration_minutes && <Tag>Thời gian: {t.duration_minutes} phút</Tag>}
							{t.min_words && <Tag>Tối thiểu: {t.min_words} từ</Tag>}
						</Flex>
						<Typography.Paragraph style={{ whiteSpace: "pre-wrap", margin: 0 }}>
							{t.prompt}
						</Typography.Paragraph>
						{t.instructions && t.instructions.length > 0 && (
							<Flex vertical gap={4}>
								<Typography.Text type="secondary">Hướng dẫn:</Typography.Text>
								<ul style={{ margin: 0, paddingLeft: 20 }}>
									{t.instructions.map((ins, i) => (
										<li key={i}>{ins}</li>
									))}
								</ul>
							</Flex>
						)}
					</Flex>
				</Card>
			))}
		</Flex>
	)
}
