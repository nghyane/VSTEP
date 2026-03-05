import { Cancel01Icon, Delete02Icon, PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	useCreateKnowledgePoint,
	useDeleteKnowledgePoint,
	useKnowledgePoints,
} from "@/hooks/use-admin-knowledge-points"
import type { KnowledgePointCategory } from "@/types/api"

export const Route = createFileRoute("/admin/knowledge-points")({
	component: KnowledgePointsPage,
})

const categoryLabels: Record<string, string> = {
	grammar: "Ngữ pháp",
	vocabulary: "Từ vựng",
	strategy: "Chiến lược",
}

const categories: KnowledgePointCategory[] = ["grammar", "vocabulary", "strategy"]

function KnowledgePointsPage() {
	const [category, setCategory] = useState<string>("")
	const [search, setSearch] = useState("")
	const [showForm, setShowForm] = useState(false)
	const [newName, setNewName] = useState("")
	const [newCategory, setNewCategory] = useState<KnowledgePointCategory>("grammar")

	const { data, isLoading, isError } = useKnowledgePoints({
		category: category || undefined,
		search: search || undefined,
	})
	const items = data?.data ?? []
	const createMutation = useCreateKnowledgePoint()
	const deleteMutation = useDeleteKnowledgePoint()

	function handleCreate() {
		if (!newName.trim()) return
		createMutation.mutate(
			{ name: newName.trim(), category: newCategory },
			{
				onSuccess: () => {
					setNewName("")
					setShowForm(false)
				},
			},
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Quản lý điểm kiến thức</h1>
				<Button size="sm" onClick={() => setShowForm(!showForm)}>
					<HugeiconsIcon icon={showForm ? Cancel01Icon : PlusSignIcon} className="size-4" />
					{showForm ? "Đóng" : "Thêm mới"}
				</Button>
			</div>

			{showForm && (
				<div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-background p-4">
					<label className="flex-1">
						<span className="mb-1 block text-sm font-medium">Tên điểm kiến thức</span>
						<input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Nhập tên..."
							className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
						/>
					</label>
					<label>
						<span className="mb-1 block text-sm font-medium">Danh mục</span>
						<select
							value={newCategory}
							onChange={(e) => setNewCategory(e.target.value as KnowledgePointCategory)}
							className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
						>
							{categories.map((c) => (
								<option key={c} value={c}>
									{categoryLabels[c]}
								</option>
							))}
						</select>
					</label>
					<Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
						{createMutation.isPending ? "Đang tạo..." : "Tạo"}
					</Button>
				</div>
			)}

			<div className="flex flex-wrap items-center gap-2">
				<Button
					size="xs"
					variant={category === "" ? "default" : "outline"}
					onClick={() => setCategory("")}
				>
					Tất cả
				</Button>
				{categories.map((c) => (
					<Button
						key={c}
						size="xs"
						variant={category === c ? "default" : "outline"}
						onClick={() => setCategory(c)}
					>
						{categoryLabels[c]}
					</Button>
				))}
			</div>

			<div className="relative">
				<HugeiconsIcon
					icon={Search01Icon}
					className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Tìm kiếm..."
					className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
				/>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-12 animate-pulse rounded-2xl bg-muted" />
					))}
				</div>
			) : isError ? (
				<p className="text-sm text-destructive">Không thể tải dữ liệu. Vui lòng thử lại.</p>
			) : items.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border p-12 text-center">
					<p className="text-muted-foreground">Chưa có điểm kiến thức nào.</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-2xl border border-border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-muted/50">
								<th className="px-4 py-3 text-left font-medium">Tên</th>
								<th className="px-4 py-3 text-left font-medium">Danh mục</th>
								<th className="px-4 py-3 text-left font-medium">Ngày tạo</th>
								<th className="px-4 py-3 text-right font-medium">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{items.map((kp) => (
								<tr key={kp.id} className="border-b border-border last:border-b-0">
									<td className="px-4 py-3 font-medium">{kp.name}</td>
									<td className="px-4 py-3">
										<Badge variant="secondary">{categoryLabels[kp.category] ?? kp.category}</Badge>
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{new Date(kp.createdAt).toLocaleDateString("vi-VN")}
									</td>
									<td className="px-4 py-3 text-right">
										<Button
											size="icon-xs"
											variant="ghost"
											className="text-destructive hover:text-destructive"
											disabled={deleteMutation.isPending}
											onClick={() => deleteMutation.mutate(kp.id)}
										>
											<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
