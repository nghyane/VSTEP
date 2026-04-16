// WritingTemplateEditor — khung bài có sẵn, user điền vào các chỗ trống.
// Text ghép từ template + giá trị blanks → đẩy lên parent qua onChange để word-count + submit dùng chung.

import { Check, CircleCheck, Lightbulb } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover"
import type { WritingTemplatePart, WritingTemplateSection } from "#/lib/mock/writing"
import { cn } from "#/lib/utils"

interface Props {
	template: readonly WritingTemplateSection[]
	onChange: (text: string) => void
}

export function WritingTemplateEditor({ template, onChange }: Props) {
	const [blanks, setBlanks] = useState<Record<string, string>>({})

	const allBlanks = useMemo(
		() =>
			template.flatMap((s) =>
				s.parts.filter(
					(p): p is WritingTemplatePart & { id: string } => p.type === "blank" && !!p.id,
				),
			),
		[template],
	)
	const totalBlanks = allBlanks.length
	const filledCount = allBlanks.filter((b) => blanks[b.id]?.trim()).length
	const progressPct = totalBlanks > 0 ? (filledCount / totalBlanks) * 100 : 0

	// Assemble text whenever blanks change.
	useEffect(() => {
		const text = template
			.map((section) =>
				section.parts
					.map((p) => (p.type === "text" ? (p.content ?? "") : (blanks[p.id ?? ""] ?? "")))
					.join(""),
			)
			.join("")
		onChange(text)
	}, [template, blanks, onChange])

	const handleBlankChange = useCallback((id: string, value: string) => {
		setBlanks((prev) => ({ ...prev, [id]: value }))
	}, [])

	return (
		<div className="space-y-4">
			<ProgressBar filled={filledCount} total={totalBlanks} pct={progressPct} />
			<div className="space-y-3">
				{template.map((section, idx) => (
					<SectionCard
						key={section.title}
						section={section}
						index={idx}
						blanks={blanks}
						onBlankChange={handleBlankChange}
					/>
				))}
			</div>
		</div>
	)
}

// ─── Progress ──────────────────────────────────────────────────────

function ProgressBar({ filled, total, pct }: { filled: number; total: number; pct: number }) {
	const done = filled === total && total > 0
	return (
		<div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2">
			<Lightbulb className={cn("size-4 shrink-0", done ? "text-success" : "text-primary")} />
			<div className="flex-1">
				<div className="flex items-center justify-between text-xs">
					<span className="font-medium">
						{filled}/{total} chỗ trống
					</span>
					<span className="text-muted-foreground">{Math.round(pct)}%</span>
				</div>
				<div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
					<div
						className={cn("h-full rounded-full transition-all", done ? "bg-success" : "bg-primary")}
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>
		</div>
	)
}

// ─── Section ───────────────────────────────────────────────────────

function SectionCard({
	section,
	index,
	blanks,
	onBlankChange,
}: {
	section: WritingTemplateSection
	index: number
	blanks: Record<string, string>
	onBlankChange: (id: string, value: string) => void
}) {
	const sectionBlanks = section.parts.filter((p) => p.type === "blank" && p.id)
	const filled = sectionBlanks.filter((p) => p.id && blanks[p.id]?.trim()).length
	const allFilled = sectionBlanks.length > 0 && filled === sectionBlanks.length

	return (
		<div
			className={cn(
				"rounded-xl border p-4 transition-colors",
				allFilled ? "border-success/30 bg-success/5" : "bg-card",
			)}
		>
			<div className="mb-2 flex items-center gap-2">
				<span
					className={cn(
						"flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
						allFilled ? "bg-success text-white" : "bg-muted text-muted-foreground",
					)}
				>
					{allFilled ? <CircleCheck className="size-3.5" /> : index + 1}
				</span>
				<span className="text-sm font-semibold">{section.title}</span>
				<span className="ml-auto text-xs text-muted-foreground tabular-nums">
					{filled}/{sectionBlanks.length}
				</span>
			</div>
			<div className="text-sm leading-8">
				{section.parts.map((part, i) => {
					if (part.type === "text") {
						return (
							<span key={`t-${i}`} className="whitespace-pre-wrap text-foreground/90">
								{part.content}
							</span>
						)
					}
					if (!part.id) return null
					return (
						<BlankInput
							key={part.id}
							blankId={part.id}
							label={part.label ?? "..."}
							hints={part.hints ?? []}
							value={blanks[part.id] ?? ""}
							onChange={(v) => onBlankChange(part.id as string, v)}
						/>
					)
				})}
			</div>
		</div>
	)
}

// ─── Blank ─────────────────────────────────────────────────────────

function BlankInput({
	blankId,
	label,
	hints,
	value,
	onChange,
}: {
	blankId: string
	label: string
	hints: readonly string[]
	value: string
	onChange: (v: string) => void
}) {
	const [open, setOpen] = useState(false)
	const filled = value.trim().length > 0
	const display = value || label
	const width = Math.max(display.length * 0.6 + 1.5, 6)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<input
					id={`blank-${blankId}`}
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={label}
					style={{ width: `${width}rem` }}
					className={cn(
						"mx-1 inline-block rounded-md border-b-2 bg-transparent px-1.5 py-0.5 text-sm outline-none transition-colors",
						filled
							? "border-success text-success"
							: "border-dashed border-muted-foreground/40 focus:border-primary placeholder:text-muted-foreground/50",
					)}
				/>
			</PopoverTrigger>
			{hints.length > 0 && (
				<PopoverContent
					side="bottom"
					align="start"
					className="w-auto max-w-sm p-2"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<p className="mb-1.5 inline-flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
						<Lightbulb className="size-3" />
						Gợi ý
					</p>
					<ul className="flex flex-col gap-0.5">
						{hints.map((hint) => (
							<li key={hint}>
								<button
									type="button"
									onClick={() => {
										onChange(hint)
										setOpen(false)
									}}
									className={cn(
										"flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
										hint === value && "bg-primary/5 text-primary",
									)}
								>
									<Check
										className={cn(
											"mt-0.5 size-3.5 shrink-0",
											hint === value ? "opacity-100" : "opacity-0",
										)}
									/>
									<span>{hint}</span>
								</button>
							</li>
						))}
					</ul>
				</PopoverContent>
			)}
		</Popover>
	)
}
