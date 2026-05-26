import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Collapse, Flex, Modal, Popconfirm, Tag, Typography } from "antd"
import { useState } from "react"
import { showError, showSuccess } from "#/components/Toaster"
import {
	useCreateReadingItem,
	useCreateReadingPassage,
	useDeleteReadingItem,
	useDeleteReadingPassage,
	useUpdateReadingItem,
	useUpdateReadingPassage,
} from "#/features/admin-exams/content-mutations"
import { McqItemForm } from "#/features/admin-exams/McqItemForm"
import { ReadingPassageForm } from "#/features/admin-exams/ReadingPassageForm"
import type { ReadingItem, ReadingPassage } from "#/features/admin-exams/types"
import { extractError } from "#/lib/api"

interface Props {
	passages: ReadingPassage[]
	examId: string
	versionId: string
}

export function ReadingTab({ passages, examId, versionId }: Props) {
	const [passageModal, setPassageModal] = useState<{ open: boolean; editing?: ReadingPassage }>({
		open: false,
	})
	const [itemModal, setItemModal] = useState<{ open: boolean; passageId?: string; editing?: ReadingItem }>({
		open: false,
	})

	const createPassage = useCreateReadingPassage(examId, versionId)
	const updatePassage = useUpdateReadingPassage(examId, versionId)
	const deletePassage = useDeleteReadingPassage(examId, versionId)
	const createItem = useCreateReadingItem(examId, versionId)
	const updateItem = useUpdateReadingItem(examId, versionId)
	const deleteItem = useDeleteReadingItem(examId, versionId)

	// Group passages by part
	const grouped = new Map<number, ReadingPassage[]>()
	for (const p of passages) {
		const list = grouped.get(p.part) ?? []
		list.push(p)
		grouped.set(p.part, list)
	}

	async function handleDeletePassage(id: string) {
		try {
			await deletePassage.mutateAsync(id)
			showSuccess("Đã xoá bài đọc.")
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
						<Flex key={p.id} vertical gap={8} style={{ paddingLeft: 8, borderLeft: "2px solid #f0f0f0" }}>
							<Flex justify="space-between" align="center">
								<Flex gap={8} align="center">
									<Typography.Text strong>{p.title ?? "(Chưa có tiêu đề)"}</Typography.Text>
									<Typography.Text type="secondary">({p.items.length} câu)</Typography.Text>
								</Flex>
								<Flex gap={4}>
									<Button
										size="small"
										icon={<PlusOutlined />}
										onClick={() => setItemModal({ open: true, passageId: p.id })}
									>
										Thêm câu
									</Button>
									<Button
										size="small"
										icon={<EditOutlined />}
										onClick={() => setPassageModal({ open: true, editing: p })}
									/>
									<Popconfirm
										title="Xoá bài đọc này? (bao gồm tất cả câu hỏi)"
										onConfirm={() => handleDeletePassage(p.id)}
										okText="Xoá"
										cancelText="Huỷ"
									>
										<Button size="small" danger icon={<DeleteOutlined />} />
									</Popconfirm>
								</Flex>
							</Flex>
							<Typography.Paragraph
								ellipsis={{ rows: 3, expandable: true, symbol: "Xem thêm" }}
								style={{ whiteSpace: "pre-wrap", margin: 0, color: "#595959" }}
							>
								{p.passage}
							</Typography.Paragraph>
							{p.items.map((item, idx) => (
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
											onClick={() => setItemModal({ open: true, passageId: p.id, editing: item })}
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
				<Button icon={<PlusOutlined />} onClick={() => setPassageModal({ open: true })}>
					Thêm bài đọc
				</Button>
			</Flex>
			{passages.length === 0 ? (
				<Typography.Text type="secondary">Chưa có nội dung Reading.</Typography.Text>
			) : (
				<Collapse items={partItems} defaultActiveKey={["part-1"]} />
			)}

			<Modal
				title={passageModal.editing ? "Sửa bài đọc" : "Thêm bài đọc"}
				open={passageModal.open}
				onCancel={() => setPassageModal({ open: false })}
				footer={null}
				destroyOnHidden
				centered
				width={720}
			>
				<ReadingPassageForm
					initial={passageModal.editing ?? undefined}
					onSubmit={async (input) => {
						if (passageModal.editing) {
							await updatePassage.mutateAsync({ id: passageModal.editing.id, ...input })
						} else {
							await createPassage.mutateAsync(input)
						}
						showSuccess(passageModal.editing ? "Đã cập nhật." : "Đã thêm bài đọc.")
						setPassageModal({ open: false })
					}}
					onCancel={() => setPassageModal({ open: false })}
					submitting={createPassage.isPending || updatePassage.isPending}
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
						} else if (itemModal.passageId) {
							await createItem.mutateAsync({ passageId: itemModal.passageId, ...input })
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
