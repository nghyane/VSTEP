import { BulbIcon, CheckmarkCircle02Icon, SparklesIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

interface TemplatePart {
	type: "text" | "blank"
	content?: string
	id?: string
	label?: string
	variant?: "transition" | "content"
	hints?: {
		b1: string[]
		b2: string[]
	}
}

interface TemplateSection {
	title: string
	parts: TemplatePart[]
}

type TargetLevel = "b1" | "b2"

// ═══════════════════════════════════════════════════
// Mock templates
// ═══════════════════════════════════════════════════

const MOCK_TEMPLATES: Record<string, TemplateSection[]> = {
	"write-1": [
		{
			title: "Lời mở đầu",
			parts: [
				{ type: "text", content: "Dear Brianna,\n\nThank you so much for " },
				{
					type: "blank",
					id: "greeting_thanks",
					label: "lời cảm ơn",
					variant: "content",
					hints: {
						b1: ["helping me", "your help", "taking care of my house"],
						b2: [
							"agreeing to look after my house",
							"being kind enough to help me out",
							"offering to take care of everything",
						],
					},
				},
				{ type: "text", content: ". I " },
				{
					type: "blank",
					id: "greeting_feeling",
					label: "cảm xúc",
					variant: "content",
					hints: {
						b1: ["am very happy", "really like it", "thank you a lot"],
						b2: [
							"really appreciate your kindness",
							"am truly grateful for your support",
							"cannot thank you enough",
						],
					},
				},
				{ type: "text", content: "." },
			],
		},
		{
			title: "Thông tin chuyến đi",
			parts: [
				{
					type: "blank",
					id: "travel_transition",
					label: "từ nối",
					variant: "transition",
					hints: {
						b1: ["First", "First of all"],
						b2: ["To begin with", "Before anything else"],
					},
				},
				{ type: "text", content: ", I will be leaving for Dubai on " },
				{
					type: "blank",
					id: "travel_departure",
					label: "ngày đi",
					variant: "content",
					hints: {
						b1: ["Monday", "next Friday", "December 15"],
						b2: ["the 15th of December", "Monday, December 15th"],
					},
				},
				{ type: "text", content: " and I plan to return on " },
				{
					type: "blank",
					id: "travel_return",
					label: "ngày về",
					variant: "content",
					hints: {
						b1: ["Sunday", "next week", "December 22"],
						b2: ["the 22nd of December", "the following Sunday"],
					},
				},
				{ type: "text", content: ". So I will be away for about " },
				{
					type: "blank",
					id: "travel_duration",
					label: "thời gian",
					variant: "content",
					hints: {
						b1: ["one week", "7 days"],
						b2: ["approximately a week", "roughly seven days"],
					},
				},
				{ type: "text", content: "." },
			],
		},
		{
			title: "Hướng dẫn chăm sóc thú cưng",
			parts: [
				{
					type: "blank",
					id: "pet_transition",
					label: "từ nối",
					variant: "transition",
					hints: {
						b1: ["About", "Now about"],
						b2: ["Regarding", "As for", "With regard to"],
					},
				},
				{ type: "text", content: " my pet, I have " },
				{
					type: "blank",
					id: "pet_desc",
					label: "mô tả thú cưng",
					variant: "content",
					hints: {
						b1: ["a cat", "a small dog", "a fish"],
						b2: [
							"a lovely cat named Mimi",
							"an adorable puppy called Max",
							"a golden retriever named Buddy",
						],
					},
				},
				{ type: "text", content: ". She needs to be " },
				{
					type: "blank",
					id: "pet_care",
					label: "cách chăm sóc",
					variant: "content",
					hints: {
						b1: ["fed two times a day", "given food every morning and evening"],
						b2: [
							"fed twice a day — once in the morning and once in the evening",
							"provided with meals at 8 a.m. and 6 p.m.",
						],
					},
				},
				{ type: "text", content: ". " },
				{
					type: "blank",
					id: "pet_extra_transition",
					label: "từ nối",
					variant: "transition",
					hints: {
						b1: ["Also", "And"],
						b2: ["In addition", "Furthermore", "On top of that"],
					},
				},
				{ type: "text", content: ", please make sure " },
				{
					type: "blank",
					id: "pet_extra",
					label: "yêu cầu thêm",
					variant: "content",
					hints: {
						b1: ["she has water", "to give her water every day"],
						b2: ["she always has fresh water in her bowl", "her water bowl is refilled daily"],
					},
				},
				{ type: "text", content: "." },
			],
		},
		{
			title: "Công việc nhà",
			parts: [
				{
					type: "blank",
					id: "house_transition",
					label: "từ nối",
					variant: "transition",
					hints: {
						b1: ["About", "For"],
						b2: ["As for", "Regarding", "When it comes to"],
					},
				},
				{ type: "text", content: " the house, could you please " },
				{
					type: "blank",
					id: "house_duty1",
					label: "công việc nhà 1",
					variant: "content",
					hints: {
						b1: ["water the plants", "clean the house"],
						b2: [
							"water the plants in the living room every two days",
							"take care of the indoor plants by watering them regularly",
						],
					},
				},
				{ type: "text", content: "? " },
				{
					type: "blank",
					id: "house_extra_transition",
					label: "từ nối",
					variant: "transition",
					hints: {
						b1: ["Also", "And"],
						b2: ["Furthermore", "In addition", "Moreover"],
					},
				},
				{ type: "text", content: ", please " },
				{
					type: "blank",
					id: "house_duty2",
					label: "công việc nhà 2",
					variant: "content",
					hints: {
						b1: ["check the mail", "lock the door at night"],
						b2: [
							"check the mailbox daily and keep any letters for me",
							"ensure all doors and windows are locked before going to bed",
						],
					},
				},
				{ type: "text", content: "." },
			],
		},
		{
			title: "Lời kết",
			parts: [
				{
					type: "blank",
					id: "closing_transition",
					label: "từ nối",
					variant: "transition",
					hints: {
						b1: ["Thank you", "Thanks again"],
						b2: ["Last but not least", "Once again", "Finally"],
					},
				},
				{ type: "text", content: ", thank you again for your help. " },
				{
					type: "blank",
					id: "closing_wish",
					label: "lời chúc / kết thúc",
					variant: "content",
					hints: {
						b1: ["I hope you will be fine", "Have a good time"],
						b2: [
							"I hope you and Mimi will get along well!",
							"I truly appreciate everything you are doing for me.",
							"Please do not hesitate to contact me if you have any questions.",
						],
					},
				},
				{ type: "text", content: "\n\nBest regards" },
			],
		},
	],
}

// ═══════════════════════════════════════════════════
// Auto-sizing inline input
// ═══════════════════════════════════════════════════

function AutoSizeInput({
	value,
	onChange,
	placeholder,
	isFilled,
	variant,
}: {
	value: string
	onChange: (v: string) => void
	placeholder: string
	isFilled: boolean
	variant: "transition" | "content"
}) {
	const displayText = value || placeholder
	const minWidth = variant === "transition" ? 100 : 140

	return (
		<span
			className="relative inline-flex align-baseline my-1 mx-0.5"
			style={{ minWidth: `${minWidth}px` }}
		>
			{/* Invisible mirror to auto-size */}
			<span className="invisible whitespace-pre px-2 py-1 text-sm" aria-hidden>
				{displayText.length > 0 ? displayText : "..."}
			</span>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={cn(
					"absolute inset-0 w-full rounded-md border-b-2 bg-transparent px-2 py-1 text-sm outline-none transition-all placeholder:text-muted-foreground/50",
					isFilled
						? "border-green-400 bg-green-50 text-green-800 dark:border-green-600 dark:bg-green-950/30 dark:text-green-300"
						: variant === "transition"
							? "border-dashed border-primary/40 text-primary focus:border-primary focus:bg-primary/5"
							: "border-dashed border-muted-foreground/30 focus:border-primary focus:bg-primary/5",
				)}
			/>
		</span>
	)
}

// ═══════════════════════════════════════════════════
// Template blank with popover
// ═══════════════════════════════════════════════════

function TemplateBlank({
	part,
	value,
	onChange,
	targetLevel,
}: {
	part: TemplatePart
	value: string
	onChange: (v: string) => void
	targetLevel: TargetLevel
}) {
	const [open, setOpen] = useState(false)
	const isFilled = value.trim().length > 0
	const hints = part.hints?.[targetLevel] ?? []
	const variant = part.variant ?? "content"

	const handleSelect = useCallback(
		(hint: string) => {
			onChange(hint)
			setOpen(false)
		},
		[onChange],
	)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<span className="inline-block">
					<AutoSizeInput
						value={value}
						onChange={onChange}
						placeholder={part.label ?? "..."}
						isFilled={isFilled}
						variant={variant}
					/>
				</span>
			</PopoverTrigger>
			{hints.length > 0 && (
				<PopoverContent
					side="bottom"
					align="start"
					className="w-auto max-w-xs p-2"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
						<HugeiconsIcon icon={BulbIcon} className="size-3" />
						{variant === "transition" ? "Chọn từ nối" : "Gợi ý"}
						<Badge variant="outline" className="ml-auto px-1 py-0 text-[9px]">
							{targetLevel.toUpperCase()}
						</Badge>
					</p>
					<div className="flex flex-wrap gap-1">
						{hints.map((hint) => (
							<button
								key={hint}
								type="button"
								onClick={() => handleSelect(hint)}
								className={cn(
									"rounded-md px-2 py-1 text-xs transition-colors",
									variant === "transition"
										? "bg-primary/10 text-primary hover:bg-primary/20"
										: "bg-muted hover:bg-muted/80",
								)}
							>
								{hint}
							</button>
						))}
					</div>
				</PopoverContent>
			)}
		</Popover>
	)
}

// ═══════════════════════════════════════════════════
// Section card
// ═══════════════════════════════════════════════════

function TemplateSectionCard({
	section,
	sectionIndex,
	filledBlanks,
	onBlankChange,
	targetLevel,
}: {
	section: TemplateSection
	sectionIndex: number
	filledBlanks: Record<string, string>
	onBlankChange: (id: string, value: string) => void
	targetLevel: TargetLevel
}) {
	const blanksInSection = section.parts.filter((p) => p.type === "blank")
	const filledInSection = blanksInSection.filter((p) => p.id && filledBlanks[p.id]?.trim()).length
	const allFilled = blanksInSection.length > 0 && filledInSection === blanksInSection.length

	return (
		<div
			className={cn(
				"rounded-xl border p-4 transition-colors",
				allFilled
					? "border-green-200 bg-green-50/30 dark:border-green-800/50 dark:bg-green-950/10"
					: "border-border bg-card",
			)}
		>
			{/* Section header */}
			<div className="mb-3 flex items-center gap-2">
				<span
					className={cn(
						"flex size-6 items-center justify-center rounded-full text-xs font-bold",
						allFilled ? "bg-green-500 text-white" : "bg-muted text-muted-foreground",
					)}
				>
					{allFilled ? (
						<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
					) : (
						sectionIndex + 1
					)}
				</span>
				<span className="text-sm font-semibold">{section.title}</span>
				<span className="ml-auto text-xs text-muted-foreground">
					{filledInSection}/{blanksInSection.length}
				</span>
			</div>

			{/* Template text with inline blanks */}
			<div className="leading-10">
				{section.parts.map((part, i) => {
					if (part.type === "text") {
						return (
							<span
								key={`${sectionIndex}-text-${i}`}
								className="text-sm text-muted-foreground whitespace-pre-wrap"
							>
								{part.content}
							</span>
						)
					}
					const blankId = part.id ?? `blank-${sectionIndex}-${i}`
					return (
						<TemplateBlank
							key={blankId}
							part={part}
							value={filledBlanks[blankId] ?? ""}
							onChange={(v) => onBlankChange(blankId, v)}
							targetLevel={targetLevel}
						/>
					)
				})}
			</div>
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Main editor
// ═══════════════════════════════════════════════════

interface WritingTemplateEditorProps {
	examId: string
}

export function WritingTemplateEditor({ examId }: WritingTemplateEditorProps) {
	const template = MOCK_TEMPLATES[examId]
	const [filledBlanks, setFilledBlanks] = useState<Record<string, string>>({})
	const [targetLevel, setTargetLevel] = useState<TargetLevel>("b1")

	const handleBlankChange = useCallback((id: string, value: string) => {
		setFilledBlanks((prev) => ({ ...prev, [id]: value }))
	}, [])

	// Count blanks
	const allBlanks = useMemo(() => {
		if (!template) return []
		return template.flatMap((s) => s.parts.filter((p) => p.type === "blank"))
	}, [template])

	const filledCount = useMemo(
		() => allBlanks.filter((b) => b.id && filledBlanks[b.id]?.trim()).length,
		[allBlanks, filledBlanks],
	)

	const totalBlanks = allBlanks.length
	const progressPct = totalBlanks > 0 ? (filledCount / totalBlanks) * 100 : 0

	if (!template) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<p className="text-sm text-muted-foreground">
					Chưa có template cho bài này. Vui lòng chọn bài luyện viết số 1.
				</p>
			</div>
		)
	}

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Top bar: progress + level toggle */}
			<div className="flex shrink-0 items-center gap-3 border-b px-5 py-3">
				{/* Progress */}
				<div className="flex flex-1 items-center gap-2">
					<HugeiconsIcon
						icon={filledCount === totalBlanks ? CheckmarkCircle02Icon : SparklesIcon}
						className={cn(
							"size-4",
							filledCount === totalBlanks ? "text-green-500" : "text-muted-foreground",
						)}
					/>
					<div className="flex-1">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium">
								{filledCount}/{totalBlanks} chỗ trống
							</span>
							<span className="text-xs text-muted-foreground">{Math.round(progressPct)}%</span>
						</div>
						<div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className={cn(
									"h-full rounded-full transition-all duration-500",
									filledCount === totalBlanks ? "bg-green-500" : "bg-primary",
								)}
								style={{ width: `${progressPct}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Level toggle */}
				<div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
					<button
						type="button"
						onClick={() => setTargetLevel("b1")}
						className={cn(
							"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
							targetLevel === "b1"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						B1
					</button>
					<button
						type="button"
						onClick={() => setTargetLevel("b2")}
						className={cn(
							"rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
							targetLevel === "b2"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						B2/C1
					</button>
				</div>
			</div>

			{/* Template sections */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-4 p-5">
					{/* Guide hint */}
					<div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2">
						<HugeiconsIcon icon={BulbIcon} className="mt-0.5 size-3.5 shrink-0 text-primary" />
						<p className="text-xs text-primary">
							Nhấn vào các ô trống để xem gợi ý. Bạn có thể chọn gợi ý hoặc tự viết câu của mình.
						</p>
					</div>

					{template.map((section, i) => (
						<TemplateSectionCard
							key={i}
							section={section}
							sectionIndex={i}
							filledBlanks={filledBlanks}
							onBlankChange={handleBlankChange}
							targetLevel={targetLevel}
						/>
					))}
				</div>
			</div>
		</div>
	)
}
