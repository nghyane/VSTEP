import { Headphones, Mic } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"

const SKILL_LABEL: Record<ExamSkillKey, string> = {
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
}

import { CoinIcon } from "#/features/coin/components/CoinIcon"
import { TopUpDialog } from "#/features/coin/components/TopUpDialog"
import { useCoins } from "#/features/coin/lib/coin-store"
import type { ExamSkillKey, MockExamSession } from "#/mocks/exam-session"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { AudioTestPlayer, MicTest } from "./DeviceTestWidgets"

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
	session: MockExamSession
	isUnlimited: boolean
	sessionCost: number
	onStart: () => void
}

const SKILL_ORDER: ExamSkillKey[] = ["listening", "reading", "writing", "speaking"]

export function DeviceCheckScreen({ session, isUnlimited, sessionCost, onStart }: Props) {
	const coins = useCoins()
	const canAfford = coins >= sessionCost
	const [topUpOpen, setTopUpOpen] = useState(false)
	const activeSkills = SKILL_ORDER.filter((sk) => {
		if (sk === "listening") return session.listening.length > 0
		if (sk === "reading") return session.reading.length > 0
		if (sk === "writing") return session.writing.length > 0
		if (sk === "speaking") return session.speaking.length > 0
		return false
	})

	const hasSpeaking = activeSkills.includes("speaking")
	const hasListening = activeSkills.includes("listening")
	const skillDurationMinutes: Record<ExamSkillKey, number> = {
		listening: session.listening.reduce((sum, section) => sum + section.durationMinutes, 0),
		reading: session.reading.reduce((sum, passage) => sum + passage.durationMinutes, 0),
		writing: session.writing.reduce((sum, task) => sum + task.durationMinutes, 0),
		speaking: session.speaking.reduce((sum, part) => sum + part.durationMinutes, 0),
	}

	return (
		<div className="flex h-full flex-col items-center overflow-y-auto bg-muted/20">
			<div className="w-full max-w-4xl space-y-6 p-6 py-10">
				{/* Title */}
				<div className="space-y-1.5 text-center">
					<h1 className="text-2xl font-bold">{session.title}</h1>
					<p className="text-sm text-muted-foreground">
						Kiểm tra thiết bị trước khi bắt đầu làm bài
					</p>
				</div>

				{/* 3 cards */}
				<div className="grid gap-4 md:grid-cols-3">
					{/* Card 1: Exam structure */}
					<div className="space-y-4 rounded-xl border border-b-2 border-b-border/60 bg-card p-5 shadow-sm">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								1
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Cấu trúc bài thi</h2>
						</div>
						<ul className="space-y-2 text-sm">
							{activeSkills.map((sk, i) => (
								<li key={sk} className="flex items-center gap-2.5">
									<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
										{i + 1}
									</span>
									<span>
										<span className="font-semibold">{SKILL_LABEL[sk].toUpperCase()}</span> &ndash;{" "}
										{skillDurationMinutes[sk]} phút
									</span>
								</li>
							))}
						</ul>
						<div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
							Tổng thời gian:{" "}
							<span className="font-semibold text-foreground">
								{isUnlimited ? "Không giới hạn" : `${session.durationMinutes} phút`}
							</span>
						</div>
					</div>

					{/* Card 2: Audio & Mic check */}
					<div className="space-y-4 rounded-xl border border-b-2 border-b-border/60 bg-card p-5 shadow-sm">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								2
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Kiểm tra âm thanh</h2>
						</div>

						{hasListening && (
							<div className="space-y-2">
								<div className="flex items-center gap-1.5">
									<Headphones className="size-3.5 text-muted-foreground" />
									<span className="text-xs font-medium">Bước 1: Nghe đoạn audio</span>
								</div>
								<AudioTestPlayer />
							</div>
						)}

						{hasSpeaking && (
							<div className={cn("space-y-2", hasListening && "border-t pt-4")}>
								<div className="flex items-center gap-1.5">
									<Mic className="size-3.5 text-muted-foreground" />
									<span className="text-xs font-medium">
										Bước {hasListening ? 2 : 1}: Thu âm thử → Nghe lại
									</span>
								</div>
								<MicTest />
							</div>
						)}

						{!hasListening && !hasSpeaking && (
							<p className="text-sm text-muted-foreground">
								Bài thi này không yêu cầu kiểm tra âm thanh.
							</p>
						)}
					</div>

					{/* Card 3: Notes */}
					<div className="space-y-4 rounded-xl border border-b-2 border-b-border/60 bg-card p-5 shadow-sm">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								3
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Lưu ý</h2>
						</div>
						<ul className="space-y-2.5 text-sm text-muted-foreground">
							{[
								"Sau khi chuyển phần, không thể quay lại phần trước.",
								"Câu trả lời được tự động lưu trong quá trình làm bài.",
								'Bấm "Phần tiếp" để sang kỹ năng kế tiếp.',
								'Bấm "Nộp bài" khi đã hoàn thành tất cả phần.',
							].map((note) => (
								<li key={note} className="flex gap-2">
									<span className="shrink-0 font-medium text-primary/60">·</span>
									<span>{note}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Start button */}
				<div className="flex flex-col items-center gap-3 pt-2">
					<div className="flex items-center gap-2 text-xs">
						<span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-amber-50 px-3 font-semibold text-amber-700 ring-1 ring-amber-200">
							<span className="flex size-4 shrink-0 items-center justify-center">
								<CoinIcon size={16} className="-translate-y-px" />
							</span>
							<span className="leading-none">Phí bài thi: {sessionCost} xu</span>
						</span>
						<span className="leading-none text-muted-foreground">Số dư: {coins} xu</span>
					</div>
					<motion.div
						whileTap={{ scale: 0.97, y: 2 }}
						transition={{ type: "spring", stiffness: 400, damping: 20 }}
						className="w-full max-w-xs"
					>
						{canAfford ? (
							<Button
								size="lg"
								className="w-full border-b-4 border-b-primary/70 text-base font-bold shadow-md"
								onClick={onStart}
							>
								Nhận đề & bắt đầu
							</Button>
						) : (
							<Button
								size="lg"
								variant="secondary"
								className="w-full border-b-4 border-b-amber-600/70 bg-amber-500 text-base font-bold text-white shadow-md hover:bg-amber-500/90"
								onClick={() => setTopUpOpen(true)}
							>
								<CoinIcon size={18} className="-translate-y-px" />
								Nạp thêm xu
							</Button>
						)}
					</motion.div>
					<p className="text-xs text-muted-foreground">
						{!canAfford
							? `Cần thêm ${sessionCost - coins} xu để bắt đầu bài thi này.`
							: isUnlimited
								? "Bài thi này không giới hạn thời gian. Bạn có thể làm với nhịp độ riêng."
								: "Thời gian sẽ bắt đầu tính khi bạn bấm nút trên"}
					</p>
				</div>
			</div>

			<TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
		</div>
	)
}
