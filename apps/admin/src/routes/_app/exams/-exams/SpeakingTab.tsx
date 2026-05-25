import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Collapse, Flex, Modal, Popconfirm, Tag, Typography } from "antd"
import { useState } from "react"
import { showError, showSuccess } from "#/components/Toaster"
import {
	useCreateSpeakingPart,
	useDeleteSpeakingPart,
	useUpdateSpeakingPart,
} from "#/features/admin-exams/content-mutations"
import { SpeakingPartForm } from "#/features/admin-exams/SpeakingPartForm"
import type { SpeakingPart } from "#/features/admin-exams/types"
import { extractError } from "#/lib/api"

interface Props {
	parts: SpeakingPart[]
	examId: string
	versionId: string
}

export function SpeakingTab({ parts, examId, versionId }: Props) {
	const [modal, setModal] = useState<{ open: boolean; editing?: SpeakingPart }>({ open: false })

	const createPart = useCreateSpeakingPart(examId, versionId)
	const updatePart = useUpdateSpeakingPart(examId, versionId)
	const deletePart = useDeleteSpeakingPart(examId, versionId)

	async function handleDelete(id: string) {
		try {
			await deletePart.mutateAsync(id)
			showSuccess("Đã xoá part.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	const items = parts.map((p) => ({
		key: p.id,
		label: (
			<Flex gap={8} align="center" justify="space-between" style={{ width: "100%" }}>
				<Flex gap={8} align="center">
					<Tag color="blue">Part {p.part}</Tag>
					<Typography.Text>{p.type}</Typography.Text>
					<Typography.Text type="secondary">
						{p.duration_minutes} phút · nói {p.speaking_seconds}s
					</Typography.Text>
				</Flex>
				<Flex gap={4} onClick={(e) => e.stopPropagation()}>
					<Button size="small" icon={<EditOutlined />} onClick={() => setModal({ open: true, editing: p })} />
					<Popconfirm
						title="Xoá part này?"
						onConfirm={() => handleDelete(p.id)}
						okText="Xoá"
						cancelText="Huỷ"
					>
						<Button size="small" danger icon={<DeleteOutlined />} />
					</Popconfirm>
				</Flex>
			</Flex>
		),
		children: <SpeakingContent part={p} />,
	}))

	return (
		<Flex vertical gap={12}>
			<Flex justify="end">
				<Button icon={<PlusOutlined />} onClick={() => setModal({ open: true })}>
					Thêm part
				</Button>
			</Flex>
			{parts.length === 0 ? (
				<Typography.Text type="secondary">Chưa có nội dung Speaking.</Typography.Text>
			) : (
				<Collapse items={items} defaultActiveKey={[parts[0]?.id]} />
			)}

			<Modal
				title={modal.editing ? "Sửa part" : "Thêm part"}
				open={modal.open}
				onCancel={() => setModal({ open: false })}
				footer={null}
				destroyOnHidden
				centered
				width={760}
			>
				<SpeakingPartForm
					initial={modal.editing ?? undefined}
					onSubmit={async (input) => {
						if (modal.editing) {
							await updatePart.mutateAsync({ id: modal.editing.id, ...input })
						} else {
							await createPart.mutateAsync(input)
						}
						showSuccess(modal.editing ? "Đã cập nhật." : "Đã thêm part.")
						setModal({ open: false })
					}}
					onCancel={() => setModal({ open: false })}
					submitting={createPart.isPending || updatePart.isPending}
				/>
			</Modal>
		</Flex>
	)
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
