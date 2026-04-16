// WritingOutlinePanel — panel cấp "Dàn ý + bài mẫu". Đặt ở cột phải, sticky.
// Tabs: Dàn ý (checkable) | Bài mẫu | Từ khóa.

import { Check } from "lucide-react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs"
import type { WritingOutlineSection } from "#/lib/mock/writing"
import { cn } from "#/lib/utils"
import { PanelHeader } from "./WritingSupportPanel"

interface Props {
	outline: readonly WritingOutlineSection[] | undefined
	sampleAnswer: string
	keywords: readonly string[]
}

export function WritingOutlinePanel({ outline, sampleAnswer, keywords }: Props) {
	return (
		<div className="space-y-4">
			<PanelHeader title="Dàn ý + bài mẫu" subtitle="Tick vào ý đã viết để theo dõi tiến độ bài." />

			<Tabs defaultValue="outline">
				<TabsList className="w-full">
					<TabsTrigger value="outline" className="flex-1">
						Dàn ý
					</TabsTrigger>
					<TabsTrigger value="sample" className="flex-1">
						Bài mẫu
					</TabsTrigger>
				</TabsList>

				<TabsContent value="outline" className="mt-3">
					{outline && outline.length > 0 ? (
						<CheckableOutline outline={outline} keywords={keywords} />
					) : (
						<p className="text-xs text-muted-foreground">Chưa có dàn ý cho bài này.</p>
					)}
				</TabsContent>

				<TabsContent value="sample" className="mt-3">
					<p className="whitespace-pre-wrap rounded-xl border bg-background p-3 text-xs leading-relaxed text-foreground/90">
						{sampleAnswer}
					</p>
				</TabsContent>
			</Tabs>
		</div>
	)
}

function CheckableOutline({
	outline,
	keywords,
}: {
	outline: readonly WritingOutlineSection[]
	keywords: readonly string[]
}) {
	const [checked, setChecked] = useState<Record<string, boolean>>({})
	const total = outline.reduce((acc, s) => acc + s.bullets.length, 0)
	const done = Object.values(checked).filter(Boolean).length

	return (
		<div className="space-y-3">
			{keywords.length > 0 && (
				<ul className="flex flex-wrap gap-1.5">
					{keywords.map((kw) => (
						<li
							key={kw}
							className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-xs font-medium text-foreground"
						>
							{kw}
						</li>
					))}
				</ul>
			)}
			<ProgressBar done={done} total={total} />
			<ol className="space-y-3">
				{outline.map((section, idx) => (
					<li key={section.title}>
						<div className="mb-1.5 flex items-center gap-2">
							<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
								{idx + 1}
							</span>
							<span className="text-xs font-semibold">{section.title}</span>
						</div>
						<ul className="space-y-1 pl-7">
							{section.bullets.map((b) => {
								const key = `${section.title}-${b}`
								const isDone = checked[key] ?? false
								return (
									<li key={key}>
										<label className="flex cursor-pointer items-start gap-2 text-xs">
											<button
												type="button"
												onClick={() => setChecked((prev) => ({ ...prev, [key]: !prev[key] }))}
												aria-pressed={isDone}
												className={cn(
													"mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
													isDone
														? "border-success bg-success text-white"
														: "border-muted-foreground/30 hover:border-primary",
												)}
											>
												{isDone && <Check className="size-3" />}
											</button>
											<span
												className={cn(
													"text-foreground/90",
													isDone && "text-muted-foreground line-through",
												)}
											>
												{b}
											</span>
										</label>
									</li>
								)
							})}
						</ul>
					</li>
				))}
			</ol>
		</div>
	)
}

function ProgressBar({ done, total }: { done: number; total: number }) {
	const pct = total > 0 ? (done / total) * 100 : 0
	return (
		<div>
			<div className="flex items-center justify-between text-[11px]">
				<span className="font-medium text-muted-foreground">
					Tiến độ: {done}/{total} ý
				</span>
				<span className="text-muted-foreground">{Math.round(pct)}%</span>
			</div>
			<div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
				<div
					className={cn(
						"h-full rounded-full transition-all",
						done === total && total > 0 ? "bg-success" : "bg-primary",
					)}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	)
}
