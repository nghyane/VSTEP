import type { ReactNode } from "react"
import { Icon } from "#/components/Icon"
import { SkillIcon } from "#/components/SkillIcon"
import type { SkillKey } from "#/lib/skills"
import { skills } from "#/lib/skills"
import { AudioTestPlayer, MicTest } from "./DeviceTestWidgets"

interface Props {
	examTitle: string
	activeSkills: SkillKey[]
	skillDurationMinutes: Record<SkillKey, number>
	totalDurationMinutes: number
	startLabel?: string
	isStarting?: boolean
	onCancel?: () => void
	onStart: () => void
}

const NOTES = [
	"Sau khi chốt một kỹ năng, bạn không thể quay lại kỹ năng đó.",
	"Câu trả lời được tự động lưu trong quá trình làm bài.",
	'Bấm "Tiếp: Phần/Đoạn/Bài" để sang phần nhỏ tiếp theo.',
	'Bấm "Chốt ... và sang ..." để chuyển kỹ năng kế tiếp.',
	'Bấm "Nộp bài" khi đã hoàn thành tất cả phần.',
]

const SKILL_META_BY_KEY = {
	listening: skills.find((skill) => skill.key === "listening"),
	reading: skills.find((skill) => skill.key === "reading"),
	writing: skills.find((skill) => skill.key === "writing"),
	speaking: skills.find((skill) => skill.key === "speaking"),
}

export function DeviceCheckScreen({
	examTitle,
	activeSkills,
	skillDurationMinutes,
	totalDurationMinutes,
	startLabel = "Bắt đầu làm bài",
	isStarting = false,
	onCancel,
	onStart,
}: Props) {
	const hasListening = activeSkills.includes("listening")
	const hasSpeaking = activeSkills.includes("speaking")
	const baseDurationMinutes = activeSkills.reduce((sum, skill) => sum + skillDurationMinutes[skill], 0)
	const isAdjustedDuration = totalDurationMinutes !== baseDurationMinutes

	return (
		<div className="relative flex h-full flex-col items-center overflow-y-auto bg-background">
			{onCancel && (
				<button
					type="button"
					onClick={onCancel}
					disabled={isStarting}
					className="btn btn-secondary absolute left-6 top-6 text-sm disabled:opacity-60"
				>
					<Icon name="back" size="xs" />
					Quay lại
				</button>
			)}

			<div className="w-full max-w-5xl space-y-6 p-6 py-10">
				<div className="space-y-2 text-center">
					<span className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-muted">
						Thời gian chưa bắt đầu
					</span>
					<h1 className="text-2xl font-extrabold leading-tight text-foreground">{examTitle}</h1>
					<p className="text-sm text-muted">Bước chuẩn bị cuối trước khi tính giờ làm bài</p>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					<div className="card space-y-4 p-5">
						<SectionHeader step="1" title="Cấu trúc bài thi" />

						<ul className="space-y-2 text-sm">
							{activeSkills.map((skill, index) => {
								const meta = SKILL_META_BY_KEY[skill]
								const durationLabel = `${isAdjustedDuration ? "mốc gốc " : ""}${skillDurationMinutes[skill]} phút`
								return (
									<li
										key={skill}
										className="flex items-center gap-2.5 rounded-(--radius-card) border border-border bg-background px-3 py-2.5"
									>
										<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-extrabold text-muted">
											{index + 1}
										</span>
										{meta && <SkillIcon name={meta.pngIcon} size="sm" className="shrink-0" />}
										<span className="min-w-0 text-foreground">
											<span className="font-bold">{meta?.label}</span>
											<span className="text-muted">
												{" · "}
												{durationLabel}
											</span>
										</span>
									</li>
								)
							})}
						</ul>

						<div className="rounded-(--radius-card) border border-border bg-background px-3 py-2 text-xs text-muted">
							Tổng thời gian làm bài:{" "}
							<span className="font-extrabold text-foreground">{totalDurationMinutes} phút</span>
							{isAdjustedDuration && <span> · đã điều chỉnh</span>}
						</div>
					</div>

					<div className="card space-y-4 p-5">
						<SectionHeader step="2" title="Kiểm tra thiết bị" />

						{hasListening && (
							<DeviceCheckBlock icon="volume" title="Nghe thử âm thanh">
								<AudioTestPlayer />
							</DeviceCheckBlock>
						)}

						{hasSpeaking && (
							<DeviceCheckBlock icon="mic" title="Thu âm thử và nghe lại">
								<MicTest />
							</DeviceCheckBlock>
						)}

						{!hasListening && !hasSpeaking && (
							<p className="rounded-(--radius-card) border border-border bg-background px-3 py-2 text-sm text-muted">
								Bài thi này không yêu cầu kiểm tra âm thanh.
							</p>
						)}
					</div>

					<div className="card space-y-4 p-5">
						<SectionHeader step="3" title="Lưu ý" />

						<ul className="space-y-2.5 text-sm text-muted">
							{NOTES.map((note) => (
								<li key={note} className="flex gap-2">
									<Icon name="check" size="xs" className="mt-0.5 shrink-0 text-primary" />
									<span>{note}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="flex flex-col items-center gap-3 pt-2">
					<button
						type="button"
						onClick={onStart}
						disabled={isStarting}
						className="btn btn-primary w-full max-w-xs disabled:opacity-60"
					>
						{isStarting ? "Đang mở phòng thi..." : startLabel}
					</button>
					<p className="text-xs text-muted">Thời gian sẽ bắt đầu tính khi bạn bấm nút trên</p>
				</div>
			</div>
		</div>
	)
}

function SectionHeader({ step, title }: { step: string; title: string }) {
	return (
		<div className="flex items-center gap-2.5">
			<span className="flex size-7 items-center justify-center rounded-full border border-primary/20 bg-primary-tint text-xs font-extrabold text-primary-dark">
				{step}
			</span>
			<h2 className="text-base font-extrabold text-foreground">{title}</h2>
		</div>
	)
}

function DeviceCheckBlock({
	icon,
	title,
	children,
}: {
	icon: "volume" | "mic"
	title: string
	children: ReactNode
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1.5 text-muted">
				<Icon name={icon} size="xs" />
				<span className="text-xs font-bold">{title}</span>
			</div>
			{children}
		</div>
	)
}
