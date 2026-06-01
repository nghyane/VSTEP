import { PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Input as AntInput, App, Empty, Flex, Table } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { showSuccess } from "#/components/Toaster"
import {
	useCreateTopupPackage,
	useDeleteTopupPackage,
	useSetTopupPackageActive,
	useUpdateTopupPackage,
} from "#/features/admin-topup/mutations"
import { adminTopupPackagesQuery } from "#/features/admin-topup/queries"
import { TopupPackageForm } from "#/features/admin-topup/TopupPackageForm"
import type { AdminTopupPackage } from "#/features/admin-topup/types"
import { extractError } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import { getTopupPackageColumns } from "./-topup-packages/columns"

interface Search {
	page?: number
	q?: string
	is_active?: "yes" | "no" | ""
}

export const Route = createFileRoute("/_app/topup-packages/")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "admin") throw redirect({ to: "/" })
	},
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		is_active: s.is_active === "yes" || s.is_active === "no" ? s.is_active : undefined,
	}),
	component: TopupPackagesPage,
})

function TopupPackagesPage() {
	const navigate = useNavigate({ from: "/topup-packages/" })
	const search = Route.useSearch()
	const { page = 1, q = "", is_active = "" } = search

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<AdminTopupPackage | null>(null)

	const { message } = App.useApp()
	const { data, isLoading } = useQuery(
		adminTopupPackagesQuery({
			page,
			q,
			is_active: is_active || undefined,
			per_page: 20,
		}),
	)
	const create = useCreateTopupPackage()
	const update = useUpdateTopupPackage()
	const remove = useDeleteTopupPackage()
	const setActive = useSetTopupPackageActive()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function handleDelete(id: string): Promise<void> {
		try {
			await remove.mutateAsync(id)
			showSuccess("Đã xoá gói nạp.")
		} catch (err) {
			const e = await extractError(err)
			message.error(e.message)
		}
	}

	async function handleToggle(p: AdminTopupPackage): Promise<void> {
		try {
			await setActive.mutateAsync({ id: p.id, active: !p.is_active })
			message.success(p.is_active ? "Đã tạm ẩn gói." : "Đã kích hoạt gói.")
		} catch (err) {
			const e = await extractError(err)
			message.error(e.message)
		}
	}

	const columns = getTopupPackageColumns({
		onEdit: setEditing,
		onToggle: handleToggle,
		onDelete: handleDelete,
	})

	// Best value lên đầu để admin scan thấy ngay; thứ tự còn lại giữ nguyên display_order từ BE.
	const rows = (data?.data ?? []).slice().sort((a, b) => Number(b.is_best_value) - Number(a.is_best_value))

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Quản lý gói nạp"
				subtitle="Tạo gói VND đổi VSTEP Coin. Bật/tắt gói tại đây sẽ áp dụng ngay cho user."
				action={
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Tạo gói nạp
					</Button>
				}
			/>

			<Flex wrap align="center" gap={8}>
				<AntInput
					prefix={<SearchOutlined />}
					placeholder="Tìm theo tên gói..."
					value={draftQ}
					onChange={(e) => setDraftQ(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") setSearch({ q: draftQ })
					}}
					style={{ maxWidth: 320, flex: 1 }}
				/>
				<div style={{ width: 200 }}>
					<Select
						value={is_active}
						onChange={(e) => setSearch({ is_active: (e.target.value || "") as "yes" | "no" | "" })}
					>
						<option value="">Tất cả trạng thái</option>
						<option value="yes">Đang bán</option>
						<option value="no">Tạm ẩn</option>
					</Select>
				</div>
			</Flex>

			{!isLoading && data?.data.length === 0 ? (
				<Empty description="Chưa có gói nạp nào." />
			) : (
				<Table
					rowKey="id"
					loading={isLoading}
					dataSource={rows}
					rowClassName={(p) => (p.is_best_value ? "topup-row-best" : "")}
					pagination={
						data && data.meta.last_page > 1
							? {
									current: data.meta.current_page,
									total: data.meta.total,
									pageSize: data.meta.per_page,
									onChange: (p) => setSearch({ page: p }),
									showSizeChanger: false,
								}
							: false
					}
					columns={columns}
				/>
			)}

			<Modal title="Tạo gói nạp" open={createOpen} onClose={() => setCreateOpen(false)} size="lg">
				<TopupPackageForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã tạo gói nạp.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal title="Sửa gói nạp" open={!!editing} onClose={() => setEditing(null)} size="lg">
				{editing && (
					<TopupPackageForm
						initial={editing}
						submitting={update.isPending}
						onCancel={() => setEditing(null)}
						onSubmit={async (input) => {
							await update.mutateAsync({ id: editing.id, input })
							showSuccess("Đã cập nhật gói nạp.")
							setEditing(null)
						}}
					/>
				)}
			</Modal>
		</Flex>
	)
}
