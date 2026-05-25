import { Collapse, Flex, Tag, Typography } from "antd"
import type { SpeakingPart } from "#/features/admin-exams/types"

interface Props {
	parts: SpeakingPart[]
	examId: string
	versionId: string
}

export function SpeakingTab({ parts }: Props) {
	if (parts.length === 0) {
		return <Typography.Text type="secondary">Chưa có nội dung Speaking.</Typography.Text>
	}

	const items = parts.map((p) => ({
		key: p.id,
		label: (
			<Flex gap={8} align="center">
				<Tag color="blue">Part {p.part}</Tag>
				<Typography.Text>{p.type}</Typography.Text>
				<Typography.Text type="secondary">
					{p.duration_minutes} phút · nói {p.speaking_seconds}s
				</Typography.Text>
			</Flex>
		),
		children: <SpeakingContent part={p} />,
	}))

	return <Collapse items={items} defaultActiveKey={[parts[0]?.id]} />
}

function SpeakingContent({ part }: { part: SpeakingPart }) {
	const content = part.content as Record<string, unknown>

	if (part.type === "social" && Array.isArray(content.topics)) {
		return <SocialContent topics={content.topics as { name: string; questions: string[] }[]} />
	}
	if (part.type === "solution") {
		return <SolutionContent content={content as { situation: string; solutions: string[]; task: string }} />
	}
	if (part.type === "topic") {
		return (
			<TopicContent content={content as { topic: string; prompt: string; follow_up_questions?: string[] }} />
		)
	}

	// Fallback cho type chưa biết
	return (
		<Typography.Text code style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
			{JSON.stringify(content, null, 2)}
		</Typography.Text>
	)
}

function SocialContent({ topics }: { topics: { name: string; questions: string[] }[] }) {
	return (
		<Flex vertical gap={12}>
			{topics.map((t) => (
				<Flex key={t.name} vertical gap={4} style={{ paddingLeft: 8, borderLeft: "2px solid #f0f0f0" }}>
					<Typography.Text strong>{t.name}</Typography.Text>
					<ul style={{ margin: 0, paddingLeft: 20 }}>
						{t.questions.map((q) => (
							<li key={q}>
								<Typography.Text>{q}</Typography.Text>
							</li>
						))}
					</ul>
				</Flex>
			))}
		</Flex>
	)
}

function SolutionContent({ content }: { content: { situation: string; solutions: string[]; task: string } }) {
	return (
		<Flex vertical gap={8}>
			<div>
				<Typography.Text type="secondary">Tình huống:</Typography.Text>
				<Typography.Paragraph style={{ margin: "4px 0 0" }}>{content.situation}</Typography.Paragraph>
			</div>
			<div>
				<Typography.Text type="secondary">Các giải pháp:</Typography.Text>
				<ol style={{ margin: "4px 0 0", paddingLeft: 20 }}>
					{content.solutions.map((s) => (
						<li key={s}>
							<Typography.Text>{s}</Typography.Text>
						</li>
					))}
				</ol>
			</div>
			<div>
				<Typography.Text type="secondary">Yêu cầu:</Typography.Text>
				<Typography.Paragraph style={{ margin: "4px 0 0" }}>{content.task}</Typography.Paragraph>
			</div>
		</Flex>
	)
}

function TopicContent({
	content,
}: {
	content: { topic: string; prompt: string; follow_up_questions?: string[] }
}) {
	return (
		<Flex vertical gap={8}>
			<div>
				<Typography.Text type="secondary">Chủ đề:</Typography.Text>
				<Typography.Text strong style={{ marginLeft: 8 }}>
					{content.topic}
				</Typography.Text>
			</div>
			<div>
				<Typography.Text type="secondary">Đề bài:</Typography.Text>
				<Typography.Paragraph style={{ margin: "4px 0 0" }}>{content.prompt}</Typography.Paragraph>
			</div>
			{content.follow_up_questions && content.follow_up_questions.length > 0 && (
				<div>
					<Typography.Text type="secondary">Câu hỏi mở rộng:</Typography.Text>
					<ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
						{content.follow_up_questions.map((q) => (
							<li key={q}>
								<Typography.Text>{q}</Typography.Text>
							</li>
						))}
					</ul>
				</div>
			)}
		</Flex>
	)
}
