import { Delete02Icon, PencilEdit01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminUsers, useDeleteUser } from "@/hooks/use-admin-users"
import { CreateUserForm } from "./-components/CreateUserForm"

export const Route = createFileRoute("/admin/users")({
	component: AdminUsersPage,
})

type Role = "admin" | "instructor" | "learner"

const ROLES: { label: string; value: Role | "" }[] = [
	{ label: "Tất cả", value: "" },
	{ label: "Admin", value: "admin" },
	{ label: "Instructor", value: "instructor" },
	{ label: "Learner", value: "learner" },
]

const roleBadge: Record<Role, "destructive" | "secondary" | "outline"> = {
	admin: "destructive",
	instructor: "secondary",
	learner: "outline",
}

function AdminUsersPage() {
	const [search, setSearch] = useState("")
	const [roleFilter, setRoleFilter] = useState("")
	const [page, setPage] = useState(1)
	const [showCreate, setShowCreate] = useState(false)

	const { data, isLoading, error } = useAdminUsers({
		page,
		search: search || undefined,
		role: roleFilter || undefined,
	})
	const deleteUser = useDeleteUser()

	const users = data?.data ?? []
	const meta = data?.meta

	function handleDelete(id: string, email: string) {
		if (window.confirm(`Xóa người dùng "${email}"?`)) {
			deleteUser.mutate(id)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Quản lý người dùng</h1>
				<Button onClick={() => setShowCreate((v) => !v)}>
					{showCreate ? "Đóng" : "Thêm người dùng"}
				</Button>
			</div>

			{showCreate && <CreateUserForm onDone={() => setShowCreate(false)} />}

			<div className="flex flex-wrap items-center gap-3">
				<div className="relative">
					<HugeiconsIcon
						icon={Search01Icon}
						className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						type="text"
						placeholder="Tìm kiếm..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value)
							setPage(1)
						}}
						className="h-9 rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
					/>
				</div>
				{ROLES.map((r) => (
					<Button
						key={r.value}
						variant={roleFilter === r.value ? "default" : "outline"}
						size="sm"
						onClick={() => {
							setRoleFilter(r.value)
							setPage(1)
						}}
					>
						{r.label}
					</Button>
				))}
			</div>

			{isLoading && <p className="py-10 text-center text-muted-foreground">Đang tải...</p>}
			{error && <p className="py-10 text-center text-destructive">Lỗi: {error.message}</p>}

			{!isLoading && !error && users.length === 0 && (
				<p className="py-10 text-center text-muted-foreground">Không có người dùng nào</p>
			)}

			{!isLoading && !error && users.length > 0 && (
				<div className="overflow-x-auto rounded-2xl border border-border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="px-4 py-3 font-medium">Tên</th>
								<th className="px-4 py-3 font-medium">Email</th>
								<th className="px-4 py-3 font-medium">Vai trò</th>
								<th className="px-4 py-3 font-medium">Ngày tạo</th>
								<th className="px-4 py-3 font-medium" />
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr key={u.id} className="border-b last:border-b-0">
									<td className="px-4 py-3">{u.fullName ?? "—"}</td>
									<td className="px-4 py-3 text-muted-foreground">{u.email}</td>
									<td className="px-4 py-3">
										<Badge variant={roleBadge[u.role]}>{u.role}</Badge>
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{new Date(u.createdAt).toLocaleDateString("vi-VN")}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-1">
											<Button variant="ghost" size="icon" className="size-8">
												<HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="size-8 text-destructive"
												onClick={() => handleDelete(u.id, u.email)}
												disabled={deleteUser.isPending}
											>
												<HugeiconsIcon icon={Delete02Icon} className="size-4" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{meta && meta.totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage(page - 1)}
					>
						Trước
					</Button>
					<span className="text-sm text-muted-foreground">
						{page} / {meta.totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= meta.totalPages}
						onClick={() => setPage(page + 1)}
					>
						Sau
					</Button>
				</div>
			)}
		</div>
	)
}
