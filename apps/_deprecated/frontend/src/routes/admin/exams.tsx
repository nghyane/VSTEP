import { Add01Icon, Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminUpdateExam, useCreateExam } from "@/hooks/use-admin-exams"
import { useExams } from "@/hooks/use-exams"
import { cn } from "@/lib/utils"
import type { ExamType, QuestionLevel } from "@/types/api"

export const Route = createFileRoute("/admin/exams")({
	component: AdminExams,
})

const levels: QuestionLevel[] = ["A2", "B1", "B2", "C1"]

const levelColor: Record<QuestionLevel, string> = {
	A2: "bg-emerald-100 text-emerald-700",
	B1: "bg-blue-100 text-blue-700",
	B2: "bg-amber-100 text-amber-700",
	C1: "bg-red-100 text-red-700",
}

const examTypeLabels: Record<ExamType, string> = {
	practice: "Luyện tập",
	placement: "Xếp lớp",
	mock: "Thi thử",
}

function AdminExams() {
	const { data, isLoading, error } = useExams()
	const createExam = useCreateExam()
	const updateExam = useAdminUpdateExam()
	const [showForm, setShowForm] = useState(false)
	const [level, setLevel] = useState<QuestionLevel>("B1")
	const [isActive, setIsActive] = useState(true)
	const [blueprint, setBlueprint] = useState("")
	const [title, setTitle] = useState("")
	const [durationMinutes, setDurationMinutes] = useState<number | undefined>(undefined)

	function handleCreate() {
		try {
			const parsed = JSON.parse(blueprint)
			createExam.mutate(
				{ title, level, blueprint: parsed, isActive, durationMinutes: durationMinutes || null },
				{
					onSuccess: () => {
						setShowForm(false)
						setBlueprint("")
						setTitle("")
						setDurationMinutes(undefined)
					},
				},
			)
		} catch {
			alert("JSON không hợp lệ")
		}
	}

	function toggleActive(id: string, current: boolean) {
		updateExam.mutate({ id, isActive: !current })
	}

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error) {
		return <p className="py-10 text-center text-destructive">Lỗi: {error.message}</p>
	}

	const exams = data?.data ?? []

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold tracking-tight">Quản lý đề thi</h1>
				<Button className="gap-2" onClick={() => setShowForm((v) => !v)}>
					<HugeiconsIcon icon={Add01Icon} className="size-4" />
					{showForm ? "Đóng" : "Tạo đề thi mới"}
				</Button>
			</div>

			{showForm && (
				<div className="rounded-2xl border bg-muted/30 p-5 space-y-4">
					<div className="flex flex-wrap gap-4">
						<label className="flex-1 space-y-1">
							<span className="text-sm font-medium">Tiêu đề</span>
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Nhập tiêu đề đề thi..."
								className="block w-full rounded-2xl border bg-background px-3 py-2 text-sm"
							/>
						</label>
						<label className="space-y-1">
							<span className="text-sm font-medium">Cấp độ</span>
							<select
								value={level}
								onChange={(e) => setLevel(e.target.value as QuestionLevel)}
								className="block rounded-2xl border bg-background px-3 py-2 text-sm"
							>
								{levels.map((l) => (
									<option key={l} value={l}>
										{l}
									</option>
								))}
							</select>
						</label>
						<label className="space-y-1">
							<span className="text-sm font-medium">Thời gian (phút)</span>
							<input
								type="number"
								value={durationMinutes ?? ""}
								onChange={(e) =>
									setDurationMinutes(e.target.value ? Number(e.target.value) : undefined)
								}
								placeholder="Ví dụ: 120"
								className="block rounded-2xl border bg-background px-3 py-2 text-sm w-32"
							/>
						</label>
						<label className="flex items-center gap-2 self-end">
							<input
								type="checkbox"
								checked={isActive}
								onChange={(e) => setIsActive(e.target.checked)}
							/>
							<span className="text-sm">Kích hoạt</span>
						</label>
					</div>
					<label className="block space-y-1">
						<span className="text-sm font-medium">Blueprint (JSON)</span>
						<textarea
							rows={5}
							value={blueprint}
							onChange={(e) => setBlueprint(e.target.value)}
							placeholder="Dán blueprint JSON tại đây..."
							className="block w-full rounded-2xl border bg-background px-3 py-2 text-sm font-mono"
						/>
					</label>
					<Button onClick={handleCreate} disabled={createExam.isPending}>
						{createExam.isPending ? "Đang tạo..." : "Tạo đề thi"}
					</Button>
				</div>
			)}

			{exams.length === 0 ? (
				<p className="py-10 text-center text-muted-foreground">Chưa có đề thi nào</p>
			) : (
				<div className="overflow-x-auto rounded-2xl border">
					<table className="w-full text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-4 py-3 text-left font-medium">Tiêu đề</th>
								<th className="px-4 py-3 text-left font-medium">Cấp độ</th>
								<th className="px-4 py-3 text-left font-medium">Loại</th>
								<th className="px-4 py-3 text-left font-medium">Thời gian</th>
								<th className="px-4 py-3 text-left font-medium">Trạng thái</th>
								<th className="px-4 py-3 text-left font-medium">Ngày tạo</th>
								<th className="px-4 py-3 text-right font-medium">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{exams.map((exam) => (
								<tr key={exam.id} className="border-t">
									<td className="px-4 py-3 font-medium">
										{exam.title || `${exam.id.slice(0, 8)}…`}
									</td>
									<td className="px-4 py-3">
										<Badge className={cn("border-0", levelColor[exam.level])}>{exam.level}</Badge>
									</td>
									<td className="px-4 py-3">{examTypeLabels[exam.type] ?? exam.type}</td>
									<td className="px-4 py-3 text-muted-foreground">
										{exam.durationMinutes ? `${exam.durationMinutes} phút` : "—"}
									</td>
									<td className="px-4 py-3">
										{exam.isActive ? (
											<span className="inline-flex items-center gap-1 text-emerald-600">
												<HugeiconsIcon icon={Tick02Icon} className="size-4" /> Hoạt động
											</span>
										) : (
											<span className="inline-flex items-center gap-1 text-muted-foreground">
												<HugeiconsIcon icon={Cancel01Icon} className="size-4" /> Tắt
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{new Date(exam.createdAt).toLocaleDateString("vi-VN")}
									</td>
									<td className="px-4 py-3 text-right">
										<Button
											variant="outline"
											size="sm"
											onClick={() => toggleActive(exam.id, exam.isActive)}
											disabled={updateExam.isPending}
										>
											{exam.isActive ? "Tắt" : "Bật"}
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
