import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Icon, StaticIcon } from "#/components/Icon"
import { restartExamSession, startExamSession } from "#/features/exam/actions"
import { DeviceCheckScreen } from "#/features/exam/components/DeviceCheckScreen"
import { DurationModePicker } from "#/features/exam/components/DurationModePicker"
import {
	buildDurationPlan,
	buildSkillDurationMinutes,
	computeBaseDurationMinutes,
	computeExamCost,
	type DurationMode,
	type DurationPlan,
	type SessionMode,
	selectedSkillsForStart,
} from "#/features/exam/exam-start-plan"
import type { ExamOverview, SkillKey, StartSessionPayload } from "#/features/exam/types"
import { walletBalanceQuery } from "#/features/wallet/queries"
import { TopUpDialog } from "#/features/wallet/TopUpDialog"
import { useToast } from "#/lib/toast"
import { cn } from "#/lib/utils"

interface Props {
	overview: ExamOverview
	mode: "full" | "custom"
	selected: Set<SkillKey>
}

type StartIntent = {
	mode: SessionMode
	selectedSkills: SkillKey[]
	durationPlan: DurationPlan
} & ({ kind: "start" } | { kind: "restart"; abandonSessionId: string })

export function StartExamPanel({ overview, mode, selected }: Props) {
	const navigate = useNavigate()
	const qc = useQueryClient()
	const { data: walletData } = useSuspenseQuery(walletBalanceQuery)

	const [confirmReset, setConfirmReset] = useState(false)
	const [startIntent, setStartIntent] = useState<StartIntent | null>(null)
	const [showTopup, setShowTopup] = useState(false)
	const [durationMode, setDurationMode] = useState<DurationMode>("standard")
	const activeSameVersion = overview.attempt_state.active_current_version_session

	const isFullTest = mode === "full"
	const canStart = isFullTest || selected.size > 0
	const cost = computeExamCost(overview, selected, isFullTest)
	const baseDurationMinutes = computeBaseDurationMinutes(overview, selected, isFullTest)
	const durationPlan = useMemo(
		() => buildDurationPlan(baseDurationMinutes, durationMode),
		[baseDurationMinutes, durationMode],
	)
	const skillDurationMinutes = useMemo<Record<SkillKey, number>>(
		() => buildSkillDurationMinutes(overview),
		[overview],
	)

	const balance = walletData.data.balance
	const insufficient = balance < cost
	const requestMode = isFullTest ? "full" : "custom"
	const requestSkills = selectedSkillsForStart(isFullTest, selected)

	function startPayload(intent: StartIntent): StartSessionPayload {
		return {
			mode: intent.mode,
			selected_skills: intent.mode === "full" ? undefined : intent.selectedSkills,
			time_extension_factor: intent.durationPlan.timeExtensionFactor,
		}
	}

	function createStartIntent(kind: StartIntent["kind"]): StartIntent | null {
		if (!canStart) return null
		if (kind === "restart") {
			if (!activeSameVersion) return null
			return {
				kind,
				mode: requestMode,
				selectedSkills: requestSkills,
				durationPlan,
				abandonSessionId: activeSameVersion.id,
			}
		}

		return {
			kind,
			mode: requestMode,
			selectedSkills: requestSkills,
			durationPlan,
		}
	}

	const mutation = useMutation({
		mutationFn: async (intent: StartIntent) => {
			if (intent.kind === "restart") {
				return restartExamSession(overview.exam.id, {
					...startPayload(intent),
					abandon_session_id: intent.abandonSessionId,
				})
			}

			return startExamSession(overview.exam.id, startPayload(intent))
		},
		onSuccess: (result) => {
			qc.invalidateQueries({ queryKey: ["wallet", "balance"] })
			qc.invalidateQueries({ queryKey: ["exam-sessions"] })
			qc.invalidateQueries({ queryKey: ["exams"] })
			setConfirmReset(false)
			setStartIntent(null)
			useToast.getState().add(`Đã trừ ${result.coins_charged} xu — chúc bạn làm bài tốt!`, "success")
			navigate({
				to: "/phong-thi/$sessionId",
				params: { sessionId: result.session_id },
			})
		},
		onError: (error) => {
			setConfirmReset(false)
			setStartIntent(null)
			qc.invalidateQueries({ queryKey: ["exams"] })
			useToast
				.getState()
				.add(error instanceof Error ? error.message : "Không bắt đầu được bài thi. Vui lòng tải lại đề thi.")
		},
	})

	function handleStartClick() {
		if (!canStart) return
		if (insufficient) {
			setShowTopup(true)
			return
		}
		if (activeSameVersion) {
			setConfirmReset(true)
			return
		}
		setStartIntent(createStartIntent("start"))
	}

	return (
		<>
			{startIntent && (
				<div className="fixed inset-0 z-50 bg-background">
					<DeviceCheckScreen
						examTitle={overview.exam.title}
						activeSkills={startIntent.selectedSkills}
						skillDurationMinutes={skillDurationMinutes}
						totalDurationMinutes={startIntent.durationPlan.displayMinutes}
						startLabel={startIntent.kind === "restart" ? "Làm lại và bắt đầu" : "Bắt đầu làm bài"}
						isStarting={mutation.isPending}
						onStart={() => mutation.mutate(startIntent)}
						onCancel={() => setStartIntent(null)}
					/>
				</div>
			)}

			<div className="card sticky top-20 space-y-5 p-5">
				<h3 className="text-sm font-extrabold uppercase tracking-wider text-muted">Thời gian và chi phí</h3>

				<div className="flex items-center justify-between rounded-(--radius-card) bg-background px-4 py-3 border border-border">
					<span className="text-sm font-bold text-muted">Tổng</span>
					<div className="flex items-center gap-2">
						<StaticIcon name="timer-md" size="xs" />
						<span className="text-lg font-extrabold tabular-nums text-foreground">
							{durationPlan.displayMinutes} phút
						</span>
					</div>
				</div>

				<DurationModePicker
					baseMinutes={durationPlan.baseMinutes}
					value={durationMode}
					onChange={setDurationMode}
				/>
				<p className="text-xs leading-relaxed text-subtle">
					Thời gian chỉ bắt đầu sau bước kiểm tra thiết bị và bạn bấm Bắt đầu làm bài.
				</p>

				<div className="flex items-center gap-2">
					<span
						className={cn(
							"inline-flex items-center gap-2 text-lg font-extrabold tabular-nums",
							insufficient ? "text-destructive" : "text-coin-dark",
						)}
					>
						<StaticIcon name="coin" size="md" className={insufficient ? "opacity-50 grayscale" : undefined} />
						{cost} xu
					</span>
				</div>

				{activeSameVersion && (
					<Link
						to="/phong-thi/$sessionId"
						params={{ sessionId: activeSameVersion.id }}
						className="btn btn-secondary text-sm w-full"
					>
						Tiếp tục làm bài
						<Icon name="lightning" size="xs" />
					</Link>
				)}

				<button
					type="button"
					onClick={handleStartClick}
					disabled={mutation.isPending || !canStart}
					className={cn(
						"btn w-full text-base py-3 disabled:opacity-60",
						insufficient ? "btn-coin group" : activeSameVersion ? "btn-destructive" : "btn-primary",
					)}
				>
					{!canStart ? (
						<span>Chọn kỹ năng</span>
					) : insufficient ? (
						<>
							<StaticIcon
								name="coin"
								size="xs"
								className="relative group-hover:animate-[coinPinch_700ms_ease-in-out]"
							/>
							<span>Nạp xu</span>
						</>
					) : (
						<>
							<span>{activeSameVersion ? "Làm lại từ đầu" : "Chuẩn bị vào thi"}</span>
							{!activeSameVersion && <Icon name="play" size="xs" />}
						</>
					)}
				</button>
			</div>

			<ConfirmDialog
				open={confirmReset}
				title="Làm lại từ đầu?"
				description={
					<>
						Lượt làm hiện tại <strong className="text-foreground">sẽ bị hủy</strong> và không hoàn xu. Bạn sẽ
						bị trừ xu cho lượt mới.
					</>
				}
				warning="Hành động không thể hoàn tác"
				confirmLabel="Làm lại và trừ xu"
				cancelLabel="Quay lại"
				loadingLabel="Đang xử lý…"
				destructive
				isLoading={mutation.isPending}
				onConfirm={() => {
					setConfirmReset(false)
					setStartIntent(createStartIntent("restart"))
				}}
				onCancel={() => setConfirmReset(false)}
			/>

			<TopUpDialog open={showTopup} onClose={() => setShowTopup(false)} />
		</>
	)
}
