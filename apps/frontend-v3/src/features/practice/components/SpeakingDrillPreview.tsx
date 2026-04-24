import type { SpeakingDrillDetail } from "#/features/practice/types"
import { FocusBar } from "#/features/vocab/components/FocusBar"

interface Props {
	drill: SpeakingDrillDetail
	starting: boolean
	onStart: () => void
}

export function SpeakingDrillPreview({ drill, starting, onStart }: Props) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar backTo="/luyen-tap/noi" current={0} total={drill.sentences.length} />
			<div className="flex-1 flex items-center justify-center px-6">
				<div className="text-center max-w-md">
					<p className="text-xs font-bold text-skill-speaking bg-skill-speaking/10 px-2.5 py-1 rounded-full inline-block mb-3">
						{drill.level}
					</p>
					<h2 className="font-extrabold text-xl text-foreground">{drill.title}</h2>
					{drill.description && <p className="text-sm text-muted mt-2">{drill.description}</p>}
					<p className="text-sm text-subtle mt-3">{drill.sentences.length} câu</p>
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
						{starting ? "Đang bắt đầu..." : "Bắt đầu luyện"}
					</button>
				</div>
			</div>
		</div>
	)
}
