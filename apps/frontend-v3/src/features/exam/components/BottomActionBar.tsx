import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Icon, StaticIcon } from "#/components/Icon"
import { abandonExamSession, startExamSession } from "#/features/exam/actions"
import { activeExamSessionQuery, appConfigQuery } from "#/features/exam/queries"
import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { walletBalanceQuery } from "#/features/wallet/queries"
import { useToast } from "#/lib/toast"
import { cn } from "#/lib/utils"

interface Props {
	detail: ExamDetail
	selected: Set<SkillKey>
}

function computeCost(selected: Set<SkillKey>, fullCost: number, perSkill: number): number {
	if (selected.size === 0 || selected.size === 4) return fullCost
	return Math.min(fullCost, perSkill * selected.size)
}

function computeDuration(detail: ExamDetail, selected: Set<SkillKey>): number {
	const { version } = detail
	let total = 0
	if (selected.size === 0 || selected.has("listening"))
		total += version.listening_sections.reduce((s, x) => s + x.duration_minutes, 0)
	if (selected.size === 0 || selected.has("reading"))
		total += version.reading_passages.reduce((s, x) => s + x.duration_minutes, 0)
	if (selected.size === 0 || selected.has("writing"))
		total += version.writing_tasks.reduce((s, x) => s + x.duration_minutes, 0)
	if (selected.size === 0 || selected.has("speaking"))
		total += version.speaking_parts.reduce((s, x) => s + x.duration_minutes, 0)
	return total
}

export function BottomActionBar({ detail, selected }: Props) {
	const navigate = useNavigate()
	const qc = useQueryClient()
	const { data: walletData } = useQuery(walletBalanceQuery)
	const { data: configData } = useQuery(appConfigQuery)
	const { data: activeData } = useQuery(activeExamSessionQuery)
	const activeSession = activeData?.data ?? null
	const activeSameExam = activeSession?.exam_id === detail.exam.id ? activeSession : null

	// Dialog: "Làm mới" (đang ở đề đang làm) hoặc "Bắt đầu đề khác" (đang có đề khác dở)
	const [confirmReset, setConfirmReset] = useState(false)

	const fullCost = configData?.data.pricing.exam.full_test_cost_coins ?? 25
	const perSkillCost = configData?.data.pricing.exam.custom_per_skill_coins ?? 8

	const isFullTest = selected.size === 0
	const cost = computeCost(selected, fullCost, perSkillCost)
	const naturalMinutes = computeDuration(detail, selected)
	const maxMinutes = naturalMinutes * 3

	// duration state — always clamped to [naturalMinutes, maxMinutes]
	const [duration, setDuration] = useState(naturalMinutes)

	// reset về 1x mỗi khi selection thay đổi làm naturalMinutes thay đổi
	useEffect(() => {
		setDuration(naturalMinutes)
	}, [naturalMinutes])
	const clampedDuration = Math.max(naturalMinutes, Math.min(maxMinutes, duration))

	const balance = walletData?.data.balance ?? null
	const insufficient = balance !== null && balance < cost

	// fill % relative to the [natural, max] range
	const fillPct =
		maxMinutes > naturalMinutes
			? ((clampedDuration - naturalMinutes) / (maxMinutes - naturalMinutes)) * 100
			: 0

	const mutation = useMutation({
		mutationFn: async () => {
			// Nếu đang có session active (cùng hoặc khác đề) và user đã xác nhận → huỷ trước.
			if (activeSession) {
				await abandonExamSession(activeSession.id)
			}
			const skills: SkillKey[] = isFullTest
				? ["listening", "reading", "writing", "speaking"]
				: Array.from(selected)
			return startExamSession(detail.exam.id, {
				mode: isFullTest ? "full" : "custom",
				selected_skills: isFullTest ? undefined : skills,
			})
		},
		onSuccess: (result) => {
			qc.invalidateQueries({ queryKey: ["wallet", "balance"] })
			qc.invalidateQueries({ queryKey: ["exam-sessions", "active"] })
			qc.invalidateQueries({ queryKey: ["exam-sessions", "mine"] })
			setConfirmReset(false)
			useToast.getState().add(`Đã trừ ${result.coins_charged} xu — chúc bạn làm bài tốt!`, "success")
			navigate({
				to: "/phong-thi/$sessionId",
				params: { sessionId: result.session_id },
				search: { examId: detail.exam.id },
			})
		},
	})

	function handleStartClick() {
		if (activeSession) {
			setConfirmReset(true)
			return
		}
		mutation.mutate()
	}

	return (
		<div
			className="fixed bottom-0 right-0 z-20 border-t-2 border-primary/20 bg-surface/95 backdrop-blur-sm"
			style={{ left: "var(--sidebar-width, 260px)", transition: "left 0.2s ease" }}
		>
			<div className="mx-auto max-w-5xl px-6 py-3">
				{isFullTest ? (
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm font-bold text-foreground">Làm full test</p>
							<p className="text-xs text-subtle">Toàn bộ 4 kỹ năng · {naturalMinutes} phút</p>
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<CostBadge cost={cost} insufficient={insufficient} />
							{activeSameExam && (
								<Link
									to="/phong-thi/$sessionId"
									params={{ sessionId: activeSameExam.id }}
									search={{ examId: detail.exam.id }}
									className="btn btn-primary"
								>
									Tiếp tục làm bài
									<Icon name="lightning" size="xs" className="text-white" />
								</Link>
							)}
							<button
								type="button"
								onClick={handleStartClick}
								disabled={insufficient || mutation.isPending}
								className={cn(
									"text-sm inline-flex items-center gap-2",
									activeSameExam
										? "rounded-(--radius-button) border-2 border-b-4 border-destructive bg-destructive px-4 py-2.5 font-extrabold text-white transition-all hover:brightness-110 active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60"
										: "btn btn-primary",
								)}
							>
								{activeSameExam ? "Làm mới" : "Làm full test"}
								<Icon name="lightning" size="xs" className="text-white" />
							</button>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
							{/* Summary */}
							<div className="flex items-center gap-3">
								<span className="text-sm font-bold text-foreground">{selected.size} kỹ năng</span>
								<span className="flex items-center gap-1.5 text-sm text-muted">
									<StaticIcon name="timer-md" size="xs" />
									<span className="inline-block min-w-[3.5rem] tabular-nums">{clampedDuration} phút</span>
								</span>
							</div>

							{/* Duration slider */}
							<div className="flex items-center gap-3">
								<span className="text-xs text-subtle whitespace-nowrap">Thời gian:</span>

								<div className="flex flex-col gap-0.5">
									<input
										type="range"
										min={naturalMinutes}
										max={maxMinutes}
										step={1}
										value={clampedDuration}
										onChange={(e) => setDuration(Number(e.target.value))}
										className="duration-slider w-36 sm:w-48"
										style={{ "--fill-pct": `${fillPct}%` } as React.CSSProperties}
									/>
									{/* Tick labels: ×1 (natural) … ×2 … ×3 (max) */}
									<div className="mt-2 flex w-36 justify-between sm:w-48">
										<span
											className={cn(
												"text-[10px]",
												clampedDuration === naturalMinutes ? "font-semibold text-primary" : "text-subtle",
											)}
										>
											{naturalMinutes}p
										</span>
										<span
											className={cn(
												"text-[10px]",
												clampedDuration === naturalMinutes * 2 ? "font-semibold text-primary" : "text-subtle",
											)}
										>
											{naturalMinutes * 2}p
										</span>
										<span
											className={cn(
												"text-[10px]",
												clampedDuration === maxMinutes ? "font-semibold text-primary" : "text-subtle",
											)}
										>
											{maxMinutes}p
										</span>
									</div>
								</div>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<CostBadge cost={cost} insufficient={insufficient} />
							{activeSameExam && (
								<Link
									to="/phong-thi/$sessionId"
									params={{ sessionId: activeSameExam.id }}
									search={{ examId: detail.exam.id }}
									className="btn btn-primary"
								>
									Tiếp tục
									<Icon name="lightning" size="xs" className="text-white" />
								</Link>
							)}
							<button
								type="button"
								onClick={handleStartClick}
								disabled={insufficient || mutation.isPending}
								className={cn(
									"text-sm inline-flex items-center gap-2",
									activeSameExam
										? "rounded-(--radius-button) border-2 border-b-4 border-destructive bg-destructive px-4 py-2.5 font-extrabold text-white transition-all hover:brightness-110 active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60"
										: "btn btn-primary",
								)}
							>
								{activeSameExam ? "Làm mới" : "Bắt đầu luyện tập"}
								<Icon name="lightning" size="xs" className="text-white" />
							</button>
						</div>
					</div>
				)}
			</div>

			<ConfirmDialog
				open={confirmReset}
				title={activeSameExam ? "Làm lại đề này?" : "Bỏ bài thi đang dở?"}
				description={
					activeSameExam ? (
						<>
							Tiến trình bài thi hiện tại <strong className="text-foreground">sẽ bị huỷ</strong> và không hoàn
							xu. Bạn sẽ mở một lượt thi mới từ đầu.
						</>
					) : (
						<>
							Bạn đang có một bài thi khác đang dở. Bắt đầu đề này sẽ{" "}
							<strong className="text-foreground">huỷ bài cũ</strong> và không hoàn xu đã trả cho bài đó.
						</>
					)
				}
				warning="Hành động không thể hoàn tác"
				confirmLabel={activeSameExam ? "Làm mới" : "Bỏ và bắt đầu"}
				cancelLabel="Quay lại"
				loadingLabel="Đang xử lý…"
				destructive
				isLoading={mutation.isPending}
				onConfirm={() => mutation.mutate()}
				onCancel={() => setConfirmReset(false)}
			/>
		</div>
	)
}

function CostBadge({ cost, insufficient }: { cost: number; insufficient: boolean }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-2 text-lg font-extrabold whitespace-nowrap tabular-nums",
				insufficient ? "text-destructive" : "text-coin-dark",
			)}
		>
			<StaticIcon name="coin" size="md" className={insufficient ? "opacity-50 grayscale" : undefined} />
			{cost} xu
		</span>
	)
}
