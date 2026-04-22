import type { SpeakingTaskDetail } from "#/features/practice/types"
import { FocusBar } from "#/features/vocab/components/FocusBar"

interface Props {
	task: SpeakingTaskDetail
	starting: boolean
	onStart: () => void
}

export function VstepSpeakingPreview({ task, starting, onStart }: Props) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar backTo="/luyen-tap/noi" current={0} total={1} />
			<div className="flex-1 flex items-center justify-center px-6">
				<div className="text-center max-w-md">
					<p className="text-xs font-bold text-skill-speaking bg-skill-speaking/10 px-2.5 py-1 rounded-full inline-block mb-3">
						Part {task.part} · {task.task_type}
					</p>
					<h2 className="font-extrabold text-xl text-foreground">{task.title}</h2>
					<p className="text-sm text-subtle mt-3">Thời gian nói: {task.speaking_seconds}s</p>
					<button
						type="button"
						onClick={onStart}
						disabled={starting}
						className="btn px-10 py-3.5 text-base mt-6 text-primary-foreground disabled:opacity-50"
						style={
							{
								background: "var(--color-skill-speaking)",
								"--btn-shadow": "var(--color-skill-speaking-dark)",
							} as React.CSSProperties
						}
					>
						{starting ? "Đang bắt đầu..." : "Bắt đầu"}
					</button>
				</div>
			</div>
		</div>
	)
}
