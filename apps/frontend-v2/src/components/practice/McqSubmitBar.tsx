// McqSubmitBar — footer submit/reset/back dùng chung cho session MCQ.

import { Link } from "@tanstack/react-router"
import { RotateCcw } from "lucide-react"
import { Button } from "#/components/ui/button"

export type McqBackRoute =
	| "/luyen-tap/ky-nang/nghe"
	| "/luyen-tap/ky-nang/doc"
	| "/luyen-tap/ky-nang/viet"
	| "/luyen-tap/ky-nang/noi"

interface Props {
	phase: "answering" | "submitted"
	answeredCount: number
	total: number
	canSubmit: boolean
	score: number
	backTo: McqBackRoute
	backLabel: string
	onSubmit: () => void
	onReset: () => void
}

export function SubmitAction({
	phase,
	canSubmit,
	backTo,
	backLabel,
	onSubmit,
	onReset,
}: {
	phase: "answering" | "submitted"
	canSubmit: boolean
	backTo: McqBackRoute
	backLabel: string
	onSubmit: () => void
	onReset: () => void
}) {
	if (phase === "answering") {
		return (
			<Button
				type="button"
				size="lg"
				className="rounded-xl px-8"
				onClick={onSubmit}
				disabled={!canSubmit}
			>
				Nộp bài
			</Button>
		)
	}
	return (
		<div className="flex gap-2">
			<Button type="button" variant="outline" onClick={onReset}>
				<RotateCcw className="size-4" />
				Làm lại
			</Button>
			<Button asChild>
				<Link to={backTo} search={{} as never}>{backLabel}</Link>
			</Button>
		</div>
	)
}

export function McqSubmitBar(props: Props) {
	const { phase, answeredCount, total, canSubmit, score, backTo, backLabel, onSubmit, onReset } =
		props

	return (
		<footer className="flex min-h-12 shrink-0 flex-wrap items-center gap-3">
			<StatusText phase={phase} answeredCount={answeredCount} total={total} score={score} />
			{phase === "answering" ? (
				<Button
					type="button"
					size="lg"
					className="rounded-xl px-8"
					onClick={onSubmit}
					disabled={!canSubmit}
				>
					Nộp bài
				</Button>
			) : (
				<div className="flex gap-2">
					<Button type="button" variant="outline" onClick={onReset}>
						<RotateCcw className="size-4" />
						Làm lại
					</Button>
					<Button asChild>
						<Link to={backTo} search={{} as never}>{backLabel}</Link>
					</Button>
				</div>
			)}
		</footer>
	)
}

export function StatusText({
	phase,
	answeredCount,
	total,
	score,
}: {
	phase: "answering" | "submitted"
	answeredCount: number
	total: number
	score: number
}) {
	if (phase === "submitted") {
		const pct = Math.round((score / total) * 100)
		return (
			<p className="text-sm text-muted-foreground">
				Kết quả:{" "}
				<strong className="text-foreground">
					{score}/{total}
				</strong>
				<span className="ml-2 font-semibold text-primary tabular-nums">({pct}%)</span>
			</p>
		)
	}
	return (
		<p className="text-sm text-muted-foreground">
			Đã chọn{" "}
			<strong className="text-foreground">
				{answeredCount}/{total}
			</strong>{" "}
			câu
		</p>
	)
}
