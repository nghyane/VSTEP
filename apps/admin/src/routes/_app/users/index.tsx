import {
	EditOutlined,
	KeyOutlined,
	LockOutlined,
	PlusOutlined,
	SearchOutlined,
	UnlockOutlined,
} from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Input as AntInput, Empty, Flex, Space, Table, Tag, Tooltip, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { showError, showSuccess } from "#/components/Toaster"
import { DeactivateTeacherModal } from "#/features/admin-users/DeactivateTeacherModal"
import {
	useActivateUser,
	useCreateUser,
	useDeactivateUser,
	useResetUserPassword,
	userListQuery,
	useUpdateUser,
} from "#/features/admin-users/queries"
import { ResetPasswordResult } from "#/features/admin-users/ResetPasswordResult"
import { type AdminUser, ROLE_LABELS, USER_ROLES, type UserRole } from "#/features/admin-users/types"
import { UserForm } from "#/features/admin-users/UserForm"
import { extractError } from "#/lib/api"
import { useAuth } from "#/lib/auth"

interface Search {
	page?: number
	q?: string
	role?: UserRole | ""
}

export const Route = createFileRoute("/_app/users/")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "admin") throw redirect({ to: "/" })
	},
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		role: USER_ROLES.includes(s.role as UserRole) ? (s.role as UserRole) : undefined,
	}),
	component: UsersPage,
})

function UsersPage() {
	const navigate = useNavigate({ from: "/users/" })
	const search = Route.useSearch()
	const { page = 1, q = "", role = "" } = search
	const currentAdmin = useAuth((s) => s.user)

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<AdminUser | null>(null)
	const [deactivatingSimple, setDeactivatingSimple] = useState<AdminUser | null>(null)
	const [deactivatingTeacher, setDeactivatingTeacher] = useState<AdminUser | null>(null)
	const [activating, setActivating] = useState<AdminUser | null>(null)
	const [resettingPw, setResettingPw] = useState<AdminUser | null>(null)
	const [pwResult, setPwResult] = useState<{ user: AdminUser; password: string } | null>(null)

	const { data, isLoading } = useQuery(userListQuery({ page, q, role: role || undefined, per_page: 20 }))
	const create = useCreateUser()
	const update = useUpdateUser(editing?.id ?? "__noop__")
	const deactivate = useDeactivateUser()
	const activate = useActivateUser()
	const resetPw = useResetUserPassword()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function handleDeactivateSimple(): Promise<void> {
		if (!deactivatingSimple) return
		try {
			await deactivate.mutateAsync({ id: deactivatingSimple.id })
			showSuccess("Đã khoá tài khoản.")
			setDeactivatingSimple(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function handleActivate(): Promise<void> {
		if (!activating) return
		try {
			await activate.mutateAsync(activating.id)
			showSuccess("Đã mở khoá tài khoản.")
			setActivating(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function handleResetPassword(): Promise<void> {
		if (!resettingPw) return
		try {
			const res = await resetPw.mutateAsync(resettingPw.id)
			setPwResult({ user: resettingPw, password: res.data.new_password })
			setResettingPw(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	function startDeactivate(u: AdminUser): void {
		if (u.role === "teacher") {
			setDeactivatingTeacher(u)
		} else {
			setDeactivatingSimple(u)
		}
	}

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Người dùng"
				subtitle="Quản lý tài khoản: tạo mới, sửa thông tin, khoá/mở, reset mật khẩu."
				action={
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Tạo người dùng
					</Button>
				}
			/>

			<Flex wrap align="center" gap={8}>
				<AntInput
					prefix={<SearchOutlined />}
					placeholder="Tìm theo email hoặc tên…"
					value={draftQ}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftQ(e.target.value)}
					onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
						if (e.key === "Enter") setSearch({ q: draftQ })
					}}
					style={{ maxWidth: 320, flex: 1 }}
				/>
				<div style={{ width: 200 }}>
					<Select value={role} onChange={(e) => setSearch({ role: (e.target.value || "") as UserRole | "" })}>
						<option value="">Tất cả vai trò</option>
						{USER_ROLES.map((r) => (
							<option key={r} value={r}>
								{ROLE_LABELS[r]}
							</option>
						))}
					</Select>
				</div>
			</Flex>

			{!isLoading && data?.data.length === 0 ? (
				<Empty description="Không có người dùng nào khớp bộ lọc." />
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
							title: "Email",
							dataIndex: "email",
							render: (v: string, u: AdminUser) => (
								<Space orientation="vertical" size={0}>
									<strong>{v}</strong>
									{u.full_name && (
										<Typography.Text type="secondary" style={{ fontSize: 12 }}>
											{u.full_name}
										</Typography.Text>
									)}
								</Space>
							),
						},
						{
							title: "Vai trò",
							dataIndex: "role",
							width: 140,
							render: (r: UserRole) => <Tag color={roleTagColor(r)}>{ROLE_LABELS[r]}</Tag>,
						},
						{
							title: "Trạng thái",
							width: 140,
							render: (_, u: AdminUser) =>
								u.deactivated_at ? (
									<Tag color="error">Đã khoá</Tag>
								) : (
									<Tag color="success">Đang hoạt động</Tag>
								),
						},
						{
							title: "Tạo lúc",
							dataIndex: "created_at",
							width: 140,
							render: (v: string) => (
								<Typography.Text type="secondary" style={{ fontSize: 12 }}>
									{new Date(v).toLocaleDateString("vi-VN")}
								</Typography.Text>
							),
						},
						{
							title: "Hành động",
							width: 200,
							align: "right" as const,
							render: (_, u: AdminUser) => (
								<UserActions
									user={u}
									isSelf={u.id === currentAdmin?.id}
									onEdit={() => setEditing(u)}
									onActivate={() => setActivating(u)}
									onDeactivate={() => startDeactivate(u)}
									onResetPassword={() => setResettingPw(u)}
								/>
							),
						},
					]}
				/>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo người dùng" size="lg">
				<UserForm
					mode="create"
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã tạo người dùng.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa người dùng" size="lg">
				{editing && (
					<UserForm
						mode="edit"
						initial={editing}
						submitting={update.isPending}
						onCancel={() => setEditing(null)}
						onSubmit={async (input) => {
							await update.mutateAsync(input)
							showSuccess("Đã cập nhật.")
							setEditing(null)
						}}
					/>
				)}
			</Modal>

			<DeactivateTeacherModal
				open={!!deactivatingTeacher}
				teacher={deactivatingTeacher}
				onClose={() => setDeactivatingTeacher(null)}
				onDone={() => {
					showSuccess("Đã khoá tài khoản giáo viên.")
					setDeactivatingTeacher(null)
				}}
			/>

			<ConfirmDialog
				open={!!deactivatingSimple}
				onClose={() => setDeactivatingSimple(null)}
				onConfirm={handleDeactivateSimple}
				title="Khoá tài khoản"
				description={
					deactivatingSimple
						? `Khoá tài khoản "${deactivatingSimple.email}"? Họ sẽ không thể đăng nhập cho tới khi được mở lại.`
						: undefined
				}
				loading={deactivate.isPending}
			/>

			<ConfirmDialog
				open={!!activating}
				onClose={() => setActivating(null)}
				onConfirm={handleActivate}
				title="Mở khoá tài khoản"
				description={activating ? `Cho phép "${activating.email}" đăng nhập trở lại?` : undefined}
				loading={activate.isPending}
			/>

			<ConfirmDialog
				open={!!resettingPw}
				onClose={() => setResettingPw(null)}
				onConfirm={handleResetPassword}
				title="Đặt lại mật khẩu"
				description={
					resettingPw
						? `Sinh mật khẩu mới cho "${resettingPw.email}"? Mật khẩu hiện tại sẽ không còn dùng được.`
						: undefined
				}
				loading={resetPw.isPending}
			/>

			<ResetPasswordResult
				open={!!pwResult}
				newPassword={pwResult?.password ?? null}
				userEmail={pwResult?.user.email ?? null}
				onClose={() => setPwResult(null)}
			/>
		</Flex>
	)
}

function UserActions({
	user,
	isSelf,
	onEdit,
	onActivate,
	onDeactivate,
	onResetPassword,
}: {
	user: AdminUser
	isSelf: boolean
	onEdit: () => void
	onActivate: () => void
	onDeactivate: () => void
	onResetPassword: () => void
}) {
	const deactivated = user.deactivated_at !== null
	// Self-protection: admin không tự khoá/reset password chính mình qua trang
	// này — đổi password đi qua dropdown account ở Topbar.
	return (
		<Space size={4}>
			<Tooltip title="Sửa thông tin">
				<button
					type="button"
					onClick={onEdit}
					style={{ background: "none", border: 0, padding: 4, cursor: "pointer" }}
					aria-label="Sửa"
				>
					<EditOutlined />
				</button>
			</Tooltip>
			<Tooltip title={isSelf ? "Dùng menu Account ở góc phải để đổi mật khẩu của bạn" : "Reset mật khẩu"}>
				<button
					type="button"
					onClick={onResetPassword}
					disabled={isSelf}
					style={{
						background: "none",
						border: 0,
						padding: 4,
						cursor: isSelf ? "not-allowed" : "pointer",
						opacity: isSelf ? 0.35 : 1,
					}}
					aria-label="Reset mật khẩu"
				>
					<KeyOutlined />
				</button>
			</Tooltip>
			{deactivated ? (
				<Tooltip title="Mở khoá">
					<button
						type="button"
						onClick={onActivate}
						style={{ background: "none", border: 0, padding: 4, cursor: "pointer", color: "#52c41a" }}
						aria-label="Mở khoá"
					>
						<UnlockOutlined />
					</button>
				</Tooltip>
			) : (
				<Tooltip title={isSelf ? "Không thể khoá tài khoản của chính bạn" : "Khoá tài khoản"}>
					<button
						type="button"
						onClick={onDeactivate}
						disabled={isSelf}
						style={{
							background: "none",
							border: 0,
							padding: 4,
							cursor: isSelf ? "not-allowed" : "pointer",
							color: isSelf ? undefined : "#cf1322",
							opacity: isSelf ? 0.35 : 1,
						}}
						aria-label="Khoá"
					>
						<LockOutlined />
					</button>
				</Tooltip>
			)}
		</Space>
	)
}

function roleTagColor(role: UserRole): string {
	switch (role) {
		case "admin":
			return "magenta"
		case "staff":
			return "blue"
		case "teacher":
			return "green"
		default:
			return "default"
	}
}
