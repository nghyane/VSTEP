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
			<div className="absolute inset-0 bg-foreground/60" />
			<div className="card relative w-full max-w-md space-y-5 p-6">
				{/* Icon + title */}
				<div className="space-y-3 text-center">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-info-tint text-info">
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
				<div className="rounded-(--radius-card) border-2 border-border bg-background px-4 py-3 text-center text-sm text-muted">
					<p>
						Bài thi gồm <span className="font-bold text-foreground">{totalSections} phần</span> với{" "}
						<span className="font-bold text-foreground">{totalQuestions} câu hỏi</span>.
					</p>
					<p className="mt-1">
						Âm thanh mỗi phần chỉ phát <span className="font-bold text-foreground">một lần duy nhất</span>,
						không thể tua lại.
					</p>
				</div>

				{/* Confirm button */}
				<button
					type="button"
					onClick={onReady}
					disabled={countdown > 0}
					className="btn btn-primary w-full disabled:opacity-50"
				>
					{countdown > 0 ? `Sẵn sàng (${countdown}s)` : "Bắt đầu làm bài"}
				</button>
			</div>
		</div>
	)
}
