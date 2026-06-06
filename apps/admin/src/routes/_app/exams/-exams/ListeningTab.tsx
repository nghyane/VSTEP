import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Collapse, Flex, Modal, Popconfirm, Tag, Typography } from "antd"
import { useState } from "react"
import { showError, showSuccess } from "#/components/Toaster"
import {
	useCreateListeningItem,
	useCreateListeningSection,
	useDeleteListeningItem,
	useDeleteListeningSection,
	useUpdateListeningItem,
	useUpdateListeningSection,
} from "#/features/admin-exams/content-mutations"
import { ListeningSectionForm } from "#/features/admin-exams/ListeningSectionForm"
import { McqItemForm } from "#/features/admin-exams/McqItemForm"
import type { ListeningItem, ListeningSection } from "#/features/admin-exams/types"
import { extractError } from "#/lib/api"

interface Props {
	sections: ListeningSection[]
	examId: string
	versionId: string
}

export function ListeningTab({ sections, examId, versionId }: Props) {
	const [sectionModal, setSectionModal] = useState<{ open: boolean; editing?: ListeningSection }>({
		open: false,
	})
	const [itemModal, setItemModal] = useState<{ open: boolean; sectionId?: string; editing?: ListeningItem }>({
		open: false,
	})

	const createSection = useCreateListeningSection(examId, versionId)
	const updateSection = useUpdateListeningSection(examId, versionId)
	const deleteSection = useDeleteListeningSection(examId, versionId)
	const createItem = useCreateListeningItem(examId, versionId)
	const updateItem = useUpdateListeningItem(examId, versionId)
	const deleteItem = useDeleteListeningItem(examId, versionId)

	// Group by part
	const grouped = new Map<number, ListeningSection[]>()
	for (const s of sections) {
		const list = grouped.get(s.part) ?? []
		list.push(s)
		grouped.set(s.part, list)
	}

	async function handleDeleteSection(id: string) {
		try {
			await deleteSection.mutateAsync(id)
			showSuccess("Đã xoá đoạn.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	async function handleDeleteItem(id: string) {
		try {
			await deleteItem.mutateAsync(id)
			showSuccess("Đã xoá câu hỏi.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
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
						<Flex key={s.id} vertical gap={8} style={{ paddingLeft: 8, borderLeft: "2px solid #f0f0f0" }}>
							<Flex justify="space-between" align="center">
								<Flex gap={8} align="center">
									<Typography.Text strong>{s.part_title}</Typography.Text>
									<Typography.Text type="secondary">({s.items.length} câu)</Typography.Text>
								</Flex>
								<Flex gap={4}>
									<Button
										size="small"
										icon={<PlusOutlined />}
										onClick={() => setItemModal({ open: true, sectionId: s.id })}
									>
										Thêm câu
									</Button>
									<Button
										size="small"
										icon={<EditOutlined />}
										onClick={() => setSectionModal({ open: true, editing: s })}
									/>
									<Popconfirm
										title="Xoá đoạn này? (bao gồm tất cả câu hỏi)"
										onConfirm={() => handleDeleteSection(s.id)}
										okText="Xoá"
										cancelText="Huỷ"
									>
										<Button size="small" danger icon={<DeleteOutlined />} />
									</Popconfirm>
								</Flex>
							</Flex>
							{s.items.map((item, idx) => (
								<Flex key={item.id} gap={8} style={{ paddingLeft: 8 }} justify="space-between" align="start">
									<Flex gap={8}>
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
									<Flex gap={4}>
										<Button
											size="small"
											type="text"
											icon={<EditOutlined />}
											onClick={() => setItemModal({ open: true, sectionId: s.id, editing: item })}
										/>
										<Popconfirm
											title="Xoá câu này?"
											onConfirm={() => handleDeleteItem(item.id)}
											okText="Xoá"
											cancelText="Huỷ"
										>
											<Button size="small" type="text" danger icon={<DeleteOutlined />} />
										</Popconfirm>
									</Flex>
								</Flex>
							))}
						</Flex>
					))}
				</Flex>
			),
		}
	})

	return (
		<Flex vertical gap={12}>
			<Flex justify="end">
				<Button icon={<PlusOutlined />} onClick={() => setSectionModal({ open: true })}>
					Thêm đoạn
				</Button>
			</Flex>
			{sections.length === 0 ? (
				<Typography.Text type="secondary">Chưa có nội dung Listening.</Typography.Text>
			) : (
				<Collapse items={partItems} defaultActiveKey={["part-1"]} />
			)}

			<Modal
				title={sectionModal.editing ? "Sửa đoạn" : "Thêm đoạn"}
				open={sectionModal.open}
				onCancel={() => setSectionModal({ open: false })}
				footer={null}
				destroyOnHidden
				centered
				width={560}
			>
				<ListeningSectionForm
					initial={sectionModal.editing ?? undefined}
					onSubmit={async (input) => {
						if (sectionModal.editing) {
							await updateSection.mutateAsync({ id: sectionModal.editing.id, ...input })
						} else {
							await createSection.mutateAsync(input)
						}
						showSuccess(sectionModal.editing ? "Đã cập nhật." : "Đã thêm đoạn.")
						setSectionModal({ open: false })
					}}
					onCancel={() => setSectionModal({ open: false })}
					submitting={createSection.isPending || updateSection.isPending}
				/>
			</Modal>

			<Modal
				title={itemModal.editing ? "Sửa câu hỏi" : "Thêm câu hỏi"}
				open={itemModal.open}
				onCancel={() => setItemModal({ open: false })}
				footer={null}
				destroyOnHidden
				centered
				width={560}
			>
				<McqItemForm
					initial={itemModal.editing ?? undefined}
					onSubmit={async (input) => {
						if (itemModal.editing) {
							await updateItem.mutateAsync({ id: itemModal.editing.id, ...input })
						} else if (itemModal.sectionId) {
							await createItem.mutateAsync({ sectionId: itemModal.sectionId, ...input })
						} else {
							return
						}
						showSuccess(itemModal.editing ? "Đã cập nhật." : "Đã thêm câu.")
						setItemModal({ open: false })
					}}
					onCancel={() => setItemModal({ open: false })}
					submitting={createItem.isPending || updateItem.isPending}
				/>
			</Modal>
		</Flex>
	)
}
