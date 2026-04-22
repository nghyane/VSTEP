import { useEffect, useState } from "react"
import { Icon } from "#/components/Icon"

interface Props {
	totalSections: number
	totalQuestions: number
	onReady: () => void
}

export function ListeningReadinessModal({ totalSections, totalQuestions, onReady }: Props) {
	const [countdown, setCountdown] = useState(3)

	useEffect(() => {
		if (countdown <= 0) return
		const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
		return () => clearTimeout(id)
	}, [countdown])

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
			<div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-xl space-y-5">
				{/* Icon + title */}
				<div className="text-center space-y-3">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-skill-listening/15 text-skill-listening">
						<Icon name="volume" size="lg" />
					</div>
					<div className="space-y-1">
						<h2 className="text-xl font-extrabold text-foreground">Bạn đã sẵn sàng chưa?</h2>
						<p className="text-sm leading-relaxed text-muted">
							Bạn có thể xem trước câu hỏi trước khi phát audio.
							<br />
							Hãy đảm bảo tai nghe đã được kết nối và âm lượng phù hợp.
						</p>
					</div>
				</div>

				{/* Info box */}
				<div className="rounded-xl border border-border bg-surface p-4 text-center text-sm text-muted space-y-1">
					<p>
						Bài thi gồm <span className="font-semibold text-foreground">{totalSections} phần</span> với{" "}
						<span className="font-semibold text-foreground">{totalQuestions} câu hỏi</span>.
					</p>
					<p>
						Âm thanh mỗi phần chỉ phát <span className="font-semibold text-foreground">một lần duy nhất</span>
						, không thể tua lại.
					</p>
				</div>

				{/* Confirm button */}
				<button
					type="button"
					onClick={onReady}
					disabled={countdown > 0}
					className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
				>
					{countdown > 0 ? `Sẵn sàng (${countdown}s)` : "Bắt đầu làm bài"}
				</button>
			</div>
		</div>
	)
}
