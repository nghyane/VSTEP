import { EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Input as AntInput, Empty, Flex, Space, Table, Tag, Tooltip, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { showSuccess } from "#/components/Toaster"
import { PromoForm } from "#/features/admin-promos/PromoForm"
import { promoListQuery, useCreatePromo, useUpdatePromo } from "#/features/admin-promos/queries"
import {
	type AdminPromoCode,
	PROMO_STATUS_LABELS,
	PROMO_STATUSES,
	type PromoStatus,
} from "#/features/admin-promos/types"

interface Search {
	page?: number
	q?: string
	status?: PromoStatus | ""
}

export const Route = createFileRoute("/_app/promo/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		status: PROMO_STATUSES.includes(s.status as PromoStatus) ? (s.status as PromoStatus) : undefined,
	}),
	component: PromoPage,
})

function PromoPage() {
	const navigate = useNavigate({ from: "/promo/" })
	const search = Route.useSearch()
	const { page = 1, q = "", status = "" } = search

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<AdminPromoCode | null>(null)

	const { data, isLoading } = useQuery(promoListQuery({ page, q, status: status || undefined, per_page: 20 }))
	const create = useCreatePromo()
	const update = useUpdatePromo(editing?.id ?? "__noop__")

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	function rowStatus(p: AdminPromoCode): PromoStatus {
		if (!p.is_active) return "inactive"
		if (p.expires_at && new Date(p.expires_at).getTime() <= Date.now()) return "expired"
		return "active"
	}

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Khuyến mãi"
				subtitle="Quản lý promo code: tạo mã, hạn dùng, hạn mức theo mã và theo tài khoản."
				action={
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Tạo mã
					</Button>
				}
			/>

			<Flex wrap align="center" gap={8}>
				<AntInput
					prefix={<SearchOutlined />}
					placeholder="Tìm theo mã hoặc đối tác…"
					value={draftQ}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftQ(e.target.value)}
					onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
						if (e.key === "Enter") setSearch({ q: draftQ })
					}}
					style={{ maxWidth: 320, flex: 1 }}
				/>
				<div style={{ width: 200 }}>
					<Select
						value={status}
						onChange={(e) => setSearch({ status: (e.target.value || "") as PromoStatus | "" })}
					>
						<option value="">Tất cả trạng thái</option>
						{PROMO_STATUSES.map((s) => (
							<option key={s} value={s}>
								{PROMO_STATUS_LABELS[s]}
							</option>
						))}
					</Select>
				</div>
			</Flex>

			{!isLoading && data?.data.length === 0 ? (
				<Empty description="Chưa có mã khuyến mãi nào." />
			) : (
				<Table
					rowKey="id"
					loading={isLoading}
					dataSource={data?.data ?? []}
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
					columns={[
						{
							title: "Mã",
							dataIndex: "code",
							render: (v: string, p: AdminPromoCode) => (
								<Space orientation="vertical" size={0}>
									<Typography.Text style={{ fontFamily: "monospace", fontWeight: 600 }}>{v}</Typography.Text>
									{p.partner_name && (
										<Typography.Text type="secondary" style={{ fontSize: 12 }}>
											{p.partner_name}
										</Typography.Text>
									)}
								</Space>
							),
						},
						{
							title: "Xu / lượt",
							dataIndex: "amount_coins",
							width: 120,
							render: (v: number) => <strong>{v.toLocaleString("vi-VN")}</strong>,
						},
						{
							title: "Đã dùng / quota",
							width: 160,
							render: (_, p: AdminPromoCode) => {
								const used = p.redemptions_count ?? 0
								const cap = p.max_total_uses
								return (
									<span>
										<strong>{used}</strong>
										<span style={{ color: "rgba(0,0,0,0.45)" }}>
											{" / "}
											{cap === null ? "∞" : cap}
										</span>
									</span>
								)
							},
						},
						{
							title: "Mỗi user",
							dataIndex: "per_account_limit",
							width: 100,
							render: (v: number) => `${v} lần`,
						},
						{
							title: "Hạn",
							width: 140,
							render: (_, p: AdminPromoCode) =>
								p.expires_at ? (
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{new Date(p.expires_at).toLocaleString("vi-VN")}
									</Typography.Text>
								) : (
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										Không hết hạn
									</Typography.Text>
								),
						},
						{
							title: "Trạng thái",
							width: 140,
							render: (_, p: AdminPromoCode) => {
								const st = rowStatus(p)
								const color = st === "active" ? "success" : st === "expired" ? "warning" : "default"
								return <Tag color={color}>{PROMO_STATUS_LABELS[st]}</Tag>
							},
						},
						{
							title: "",
							width: 60,
							align: "right" as const,
							render: (_, p: AdminPromoCode) => (
								<Tooltip title="Sửa">
									<button
										type="button"
										onClick={() => setEditing(p)}
										style={{ background: "none", border: 0, padding: 4, cursor: "pointer" }}
										aria-label="Sửa"
									>
										<EditOutlined />
									</button>
								</Tooltip>
							),
						},
					]}
				/>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo mã khuyến mãi" size="lg">
				<PromoForm
					mode="create"
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã tạo mã khuyến mãi.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa mã khuyến mãi" size="lg">
				{editing && (
					<PromoForm
						mode="edit"
						initial={editing}
						hasRedemptions={(editing.redemptions_count ?? 0) > 0}
						submitting={update.isPending}
						onCancel={() => setEditing(null)}
						onSubmit={async (input) => {
							await update.mutateAsync(input)
							showSuccess("Đã cập nhật mã.")
							setEditing(null)
						}}
					/>
				)}
			</Modal>
		</Flex>
	)
}
