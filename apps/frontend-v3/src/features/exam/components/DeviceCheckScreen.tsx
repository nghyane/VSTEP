import { Icon } from "#/components/Icon"
import type { SkillKey } from "#/lib/skills"
import { skills } from "#/lib/skills"
import { cn } from "#/lib/utils"
import { AudioTestPlayer, MicTest } from "./DeviceTestWidgets"

interface Props {
	examTitle: string
	activeSkills: SkillKey[]
	skillDurationMinutes: Record<SkillKey, number>
	totalDurationMinutes: number
	coinsCharged: number
	onStart: () => void
}

const NOTES = [
	"Sau khi chuyển phần, không thể quay lại phần trước.",
	"Câu trả lời được tự động lưu trong quá trình làm bài.",
	'Bấm "Phần tiếp" để sang kỹ năng kế tiếp.',
	'Bấm "Nộp bài" khi đã hoàn thành tất cả phần.',
]

export function DeviceCheckScreen({
	examTitle,
	activeSkills,
	skillDurationMinutes,
	totalDurationMinutes,
	coinsCharged,
	onStart,
}: Props) {
	const hasListening = activeSkills.includes("listening")
	const hasSpeaking = activeSkills.includes("speaking")
	const skillByKey = Object.fromEntries(skills.map((s) => [s.key, s]))

	return (
		<div className="flex h-full flex-col items-center overflow-y-auto bg-background">
			<div className="w-full max-w-5xl space-y-6 p-6 py-10">
				{/* Title */}
				<div className="space-y-1.5 text-center">
					<h1 className="text-2xl font-extrabold text-foreground">{examTitle}</h1>
					<p className="text-sm text-muted">Kiểm tra thiết bị trước khi bắt đầu làm bài</p>
				</div>

				{/* 3 cards grid */}
				<div className="grid gap-4 md:grid-cols-3">
					{/* Card 1: Exam structure */}
					<div className="card space-y-4 p-5">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
								1
							</span>
							<h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Cấu trúc bài thi</h2>
						</div>
						<ul className="space-y-2 text-sm">
							{activeSkills.map((sk, i) => {
								const meta = skillByKey[sk]
								return (
									<li key={sk} className="flex items-center gap-2.5">
										<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-muted">
											{i + 1}
										</span>
										<span
											className="flex size-6 shrink-0 items-center justify-center rounded-lg text-white"
											style={{ backgroundColor: meta?.color }}
										>
											{meta && <Icon name={meta.icon} size="xs" />}
										</span>
										<span className="text-foreground">
											<span className="font-bold">{meta?.label.toUpperCase()}</span>
											<span className="text-muted"> – {skillDurationMinutes[sk]} phút</span>
										</span>
									</li>
								)
							})}
						</ul>
						<div className="rounded-xl border-2 border-border bg-surface px-3 py-2 text-xs text-muted">
							Tổng thời gian: <span className="font-bold text-foreground">{totalDurationMinutes} phút</span>
						</div>
					</div>

					{/* Card 2: Audio & Mic check */}
					<div className="card space-y-4 p-5">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
								2
							</span>
							<h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Kiểm tra âm thanh</h2>
						</div>

						{hasListening && (
							<div className="space-y-2">
								<div className="flex items-center gap-1.5 text-muted">
									<Icon name="volume" size="xs" />
									<span className="text-xs font-semibold">Bước 1: Nghe đoạn audio</span>
								</div>
								<AudioTestPlayer />
							</div>
						)}

						{hasSpeaking && (
							<div className={cn("space-y-2", hasListening && "border-t border-border pt-4")}>
								<div className="flex items-center gap-1.5 text-muted">
									<Icon name="mic" size="xs" />
									<span className="text-xs font-semibold">
										Bước {hasListening ? 2 : 1}: Thu âm thử → Nghe lại
									</span>
								</div>
								<MicTest />
							</div>
						)}

						{!hasListening && !hasSpeaking && (
							<p className="text-sm text-muted">Bài thi này không yêu cầu kiểm tra âm thanh.</p>
						)}
					</div>

					{/* Card 3: Notes */}
					<div className="card space-y-4 p-5">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
								3
							</span>
							<h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Lưu ý</h2>
						</div>
						<ul className="space-y-2.5 text-sm text-muted">
							{NOTES.map((note) => (
								<li key={note} className="flex gap-2">
									<span className="shrink-0 font-bold text-primary/70">·</span>
									<span>{note}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Start button */}
				<div className="flex flex-col items-center gap-3 pt-2">
					<div className="flex items-center gap-2 text-xs">
						<span className="inline-flex items-center gap-1.5 font-bold text-warning">
							<Icon name="gem-mono" size="xs" className="text-warning" />
							Phí bài thi: {coinsCharged} xu
						</span>
					</div>
					<button type="button" onClick={onStart} className="btn btn-primary w-full max-w-xs">
						Nhận đề & bắt đầu
					</button>
					<p className="text-xs text-muted">Thời gian sẽ bắt đầu tính khi bạn bấm nút trên</p>
				</div>
			</div>
		</div>
	)
}
