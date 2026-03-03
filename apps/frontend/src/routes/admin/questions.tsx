import {
	Book02Icon,
	Delete02Icon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
	ViewIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminQuestions, useDeleteQuestion } from "@/hooks/use-admin-questions"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/admin/questions")({
	component: AdminQuestions,
})

const skillMeta: Record<string, { label: string; color: string; icon: IconSvgElement }> = {
	listening: {
		label: "Nghe",
		color: "bg-skill-listening/15 text-skill-listening",
		icon: HeadphonesIcon,
	},
	reading: { label: "Đọc", color: "bg-skill-reading/15 text-skill-reading", icon: Book02Icon },
	writing: {
		label: "Viết",
		color: "bg-skill-writing/15 text-skill-writing",
		icon: PencilEdit02Icon,
	},
	speaking: { label: "Nói", color: "bg-skill-speaking/15 text-skill-speaking", icon: Mic01Icon },
}

const skills = ["listening", "reading", "writing", "speaking"] as const

function AdminQuestions() {
	const [skill, setSkill] = useState<string>("")
	const [search, setSearch] = useState("")
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const { data, isLoading, error } = useAdminQuestions({
		skill: skill || undefined,
		search: search || undefined,
	})
	const deleteQuestion = useDeleteQuestion()

	function handleDelete(id: string) {
		if (confirm("Bạn có chắc muốn xóa câu hỏi này?")) {
			deleteQuestion.mutate(id)
		}
	}

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error) {
		return <p className="py-10 text-center text-destructive">Lỗi: {error.message}</p>
	}

	const questions = data?.data ?? []

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold tracking-tight">Ngân hàng câu hỏi</h1>

			<div className="flex flex-wrap items-center gap-3">
				<Button
					variant={skill === "" ? "default" : "outline"}
					size="sm"
					onClick={() => setSkill("")}
				>
					Tất cả
				</Button>
				{skills.map((s) => {
					const meta = skillMeta[s]
					return (
						<Button
							key={s}
							variant={skill === s ? "default" : "outline"}
							size="sm"
							className="gap-1.5"
							onClick={() => setSkill(s)}
						>
							<HugeiconsIcon icon={meta.icon} className="size-4" />
							{meta.label}
						</Button>
					)
				})}
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Tìm kiếm..."
					className="ml-auto rounded-2xl border bg-background px-3 py-1.5 text-sm"
				/>
			</div>

			{questions.length === 0 ? (
				<p className="py-10 text-center text-muted-foreground">Không tìm thấy câu hỏi nào</p>
			) : (
				<div className="overflow-x-auto rounded-2xl border">
					<table className="w-full text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-4 py-3 text-left font-medium">Kỹ năng</th>
								<th className="px-4 py-3 text-left font-medium">Phần</th>
								<th className="px-4 py-3 text-left font-medium">Trạng thái</th>
								<th className="px-4 py-3 text-left font-medium">Ngày tạo</th>
								<th className="px-4 py-3 text-right font-medium">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{questions.map((q) => {
								const meta = skillMeta[q.skill]
								const isExpanded = expandedId === q.id
								return (
									<>
										<tr key={q.id} className="border-t">
											<td className="px-4 py-3">
												<Badge className={cn("gap-1 border-0", meta?.color)}>
													{meta && <HugeiconsIcon icon={meta.icon} className="size-3.5" />}
													{meta?.label ?? q.skill}
												</Badge>
											</td>
											<td className="px-4 py-3">Part {q.part}</td>
											<td className="px-4 py-3">
												{q.isActive ? (
													<span className="text-emerald-600">Hoạt động</span>
												) : (
													<span className="text-muted-foreground">Tắt</span>
												)}
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{new Date(q.createdAt).toLocaleDateString("vi-VN")}
											</td>
											<td className="px-4 py-3 text-right space-x-2">
												<Button
													variant="outline"
													size="sm"
													className="gap-1"
													onClick={() => setExpandedId(isExpanded ? null : q.id)}
												>
													<HugeiconsIcon icon={ViewIcon} className="size-3.5" />
													Xem
												</Button>
												<Button
													variant="outline"
													size="sm"
													className="gap-1 text-destructive hover:text-destructive"
													onClick={() => handleDelete(q.id)}
													disabled={deleteQuestion.isPending}
												>
													<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
													Xóa
												</Button>
											</td>
										</tr>
										{isExpanded && (
											<tr key={`${q.id}-detail`} className="border-t bg-muted/20">
												<td colSpan={5} className="px-4 py-3">
													<pre className="max-h-64 overflow-auto rounded-2xl bg-muted/40 p-3 text-xs font-mono">
														{JSON.stringify(q.content, null, 2)}
													</pre>
												</td>
											</tr>
										)}
									</>
								)
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
