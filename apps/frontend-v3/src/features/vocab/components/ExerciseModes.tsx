import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Icon, type IconName } from "#/components/Icon"
import type { PracticeMode } from "#/features/vocab/types"
import { cn } from "#/lib/utils"

interface ModeOption {
	mode: PracticeMode
	icon: IconName
	title: string
	subtitle: string
	requiresExercises: boolean
}

const OPTIONS: ModeOption[] = [
	{
		mode: "flashcard",
		icon: "flashcard",
		title: "Thẻ flashcard",
		subtitle: "Lật thẻ + nhắc lại cách quãng",
		requiresExercises: false,
	},
	{
		mode: "typing",
		icon: "keyboard",
		title: "Gõ từ",
		subtitle: "Gõ tiếng Anh từ trí nhớ",
		requiresExercises: false,
	},
	{
		mode: "listen",
		icon: "headphones",
		title: "Nghe",
		subtitle: "Nghe và nhớ lại từ",
		requiresExercises: false,
	},
	{
		mode: "reverse",
		icon: "swap",
		title: "Đảo ngược",
		subtitle: "Xem nghĩa, nhớ lại từ",
		requiresExercises: false,
	},
	{
		mode: "fill_blank",
		icon: "fill-blank",
		title: "Điền chỗ trống",
		subtitle: "Điền từ vào câu",
		requiresExercises: true,
	},
	{
		mode: "mixed",
		icon: "shuffle",
		title: "Hỗn hợp",
		subtitle: "Ngẫu nhiên, tối đa thách thức",
		requiresExercises: false,
	},
]

interface Props {
	topicId: string
	hasFillBlank: boolean
}

export function ExerciseModes({ topicId, hasFillBlank }: Props) {
	const navigate = useNavigate()
	const [selected, setSelected] = useState<PracticeMode>("flashcard")

	function start() {
		navigate({
			to: "/vocab/$topicId/practice",
			params: { topicId },
			search: { mode: selected },
		})
	}

	return (
		<section className="card p-4 lg:sticky lg:top-4">
			<h3 className="font-extrabold text-base text-foreground">Chế độ luyện tập</h3>
			<p className="text-xs text-muted mt-0.5 mb-3">Chọn cách bạn muốn luyện từ</p>
			<div className="space-y-2">
				{OPTIONS.map((opt) => {
					const disabled = opt.requiresExercises && !hasFillBlank
					const state = disabled ? "disabled" : selected === opt.mode ? "selected" : "idle"
					return <ModeRow key={opt.mode} option={opt} state={state} onSelect={() => setSelected(opt.mode)} />
				})}
			</div>
			<button type="button" onClick={start} className="btn btn-primary w-full py-3 text-sm mt-4">
				Bắt đầu luyện tập
			</button>
		</section>
	)
}

interface RowProps {
	option: ModeOption
	state: "idle" | "selected" | "disabled"
	onSelect: () => void
}

function ModeRow({ option, state, onSelect }: RowProps) {
	const selected = state === "selected"
	const disabled = state === "disabled"
	return (
		<button
			type="button"
			onClick={onSelect}
			disabled={disabled}
			aria-pressed={selected}
			className={cn(
				"w-full flex items-center gap-3 p-2.5 rounded-(--radius-button) border-2 text-left transition",
				selected ? "border-primary bg-primary-tint" : "border-border bg-surface hover:bg-background",
				disabled && "opacity-50 cursor-not-allowed",
			)}
		>
			<span
				className={cn(
					"shrink-0 size-9 rounded-lg border-2 flex items-center justify-center",
					selected ? "border-primary bg-surface" : "border-border bg-background",
				)}
			>
				<Icon name={option.icon} size="xs" className={selected ? "text-primary" : "text-muted"} />
			</span>
			<span className="flex-1 min-w-0">
				<span className={cn("block font-bold text-sm", selected ? "text-primary" : "text-foreground")}>
					{option.title}
				</span>
				<span className="block text-[11px] text-muted leading-tight mt-0.5 truncate">{option.subtitle}</span>
			</span>
			<span
				className={cn(
					"shrink-0 size-4 rounded-full border-2 flex items-center justify-center",
					selected ? "border-primary bg-primary" : "border-border",
				)}
			>
				{selected && <span className="size-1.5 rounded-full bg-surface" />}
			</span>
		</button>
	)
}
