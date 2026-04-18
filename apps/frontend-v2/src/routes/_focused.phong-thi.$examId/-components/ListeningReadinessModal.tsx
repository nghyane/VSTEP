// ListeningReadinessModal — modal đếm ngược trước khi bắt đầu listening exam.

import { Headphones } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "#/shared/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/shared/ui/dialog"

export function ReadinessModal({
	totalSections,
	totalQuestions,
	onReady,
}: {
	totalSections: number
	totalQuestions: number
	onReady: () => void
}) {
	const [countdown, setCountdown] = useState(3)
	useEffect(() => {
		if (countdown <= 0) return
		const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
		return () => clearTimeout(id)
	}, [countdown])
	return (
		<Dialog open>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader className="items-center text-center">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
						<Headphones className="size-8 text-primary" />
					</div>
					<DialogTitle className="text-xl">Bạn đã sẵn sàng chưa?</DialogTitle>
					<DialogDescription className="text-balance text-center">
						Bạn có thể xem trước câu hỏi trước khi phát audio.
						<br />
						Hãy đảm bảo tai nghe đã được kết nối và âm lượng phù hợp.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-1 rounded-lg border bg-muted/50 p-3 text-center text-sm text-muted-foreground">
					<p>
						Bài thi gồm <span className="font-medium text-foreground">{totalSections} phần</span>{" "}
						với <span className="font-medium text-foreground">{totalQuestions} câu hỏi</span>.
					</p>
					<p>
						Âm thanh mỗi phần chỉ phát{" "}
						<span className="font-medium text-foreground">một lần duy nhất</span>, không thể tua
						lại.
					</p>
				</div>
				<DialogFooter className="sm:justify-center">
					<Button size="lg" className="w-full" disabled={countdown > 0} onClick={onReady}>
						{countdown > 0 ? `Sẵn sàng (${countdown}s)` : "Bắt đầu làm bài"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
