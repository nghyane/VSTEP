import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Icon, StaticIcon } from "#/components/Icon"
import { abandonExamSession, startExamSession } from "#/features/exam/actions"
import { appConfigQuery, mySessionsQuery } from "#/features/exam/queries"
import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { walletBalanceQuery } from "#/features/wallet/queries"
import { TopUpDialog } from "#/features/wallet/TopUpDialog"
import { useToast } from "#/lib/toast"
import { cn } from "#/lib/utils"

type DurationMode = "standard" | "slow" | "fast"

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

function computeModeDuration(natural: number, mode: DurationMode): number {
	if (mode === "slow") return natural + 20
	if (mode === "fast") return Math.max(1, natural - 10)
	return natural
}

const SKILL_LABEL: Record<string, string> = {
	listening: "NGHE",
	reading: "ĐỌC",
	writing: "VIẾT",
	speaking: "NÓI",
}

const MODES: { key: DurationMode; label: string; desc: (n: number) => string }[] = [
	{ key: "standard", label: "Chuẩn", desc: () => "" },
	{ key: "slow", label: "Luyện chậm", desc: () => "+20 phút" },
	{ key: "fast", label: "Ôn tập nhanh", desc: () => "−10 phút" },
]

export function DurationPanel({ detail, selected }: Props) {
	const navigate = useNavigate()
	const qc = useQueryClient()
	const { data: walletData } = useQuery(walletBalanceQuery)
	const { data: configData } = useQuery(appConfigQuery)
	const { data: mySessionsData } = useQuery(mySessionsQuery)

	const [mode, setMode] = useState<DurationMode>("standard")
	const [confirmReset, setConfirmReset] = useState(false)
	const [showTopup, setShowTopup] = useState(false)

	const activeSameExam = useMemo(() => {
		const sessions = mySessionsData?.data ?? []
		const now = Date.now()
		return (
			sessions.find(
				(s) =>
					s.exam_id === detail.exam.id &&
					s.status === "active" &&
					new Date(s.server_deadline_at).getTime() > now,
			) ?? null
		)
	}, [mySessionsData, detail.exam.id])

	const fullCost = configData?.data.pricing.exam.full_test_cost_coins ?? 25
	const perSkillCost = configData?.data.pricing.exam.custom_per_skill_coins ?? 8

	const isFullTest = selected.size === 0 || selected.size === 4
	const cost = computeCost(selected, fullCost, perSkillCost)
	const naturalMinutes = computeDuration(detail, selected)
	const displayMinutes = computeModeDuration(naturalMinutes, mode)

	const balance = walletData?.data.balance ?? null
	const insufficient = balance !== null && balance < cost

	const mutation = useMutation({
		mutationFn: async () => {
			if (activeSameExam) {
				await abandonExamSession(activeSameExam.id)
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
			qc.invalidateQueries({ queryKey: ["exam-sessions"] })
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
		if (insufficient) {
			setShowTopup(true)
			return
		}
		if (activeSameExam) {
			setConfirmReset(true)
			return
		}
		mutation.mutate()
	}

	const startLabel = useMemo(() => {
		const skillLabel = isFullTest
			? "FULL TEST"
			: selected.size === 1
				? (SKILL_LABEL[[...selected][0]] ?? "")
				: "LUYỆN TẬP"
		return `BẮT ĐẦU ${skillLabel}`
	}, [isFullTest, selected])

	return (
		<>
			<div className="card p-5 space-y-5 sticky top-20">
				<h3 className="text-sm font-extrabold uppercase tracking-wider text-muted">Thời gian luyện tập</h3>

				<div className="space-y-2">
					{MODES.map(({ key, label, desc }) => {
						const mins = computeModeDuration(naturalMinutes, key)
						const active = mode === key
						return (
							<label
								key={key}
								className={cn(
									"flex items-center justify-between px-3 py-2.5 rounded-(--radius-button) cursor-pointer transition-colors border-2",
									active ? "border-primary/30 bg-primary-tint" : "border-transparent hover:bg-background",
								)}
							>
								<input
									type="radio"
									name="duration-mode"
									value={key}
									checked={active}
									onChange={() => setMode(key)}
									className="sr-only"
								/>
								<div className="flex items-center gap-3">
									<div
										className={cn(
											"size-4 rounded-full border-2 flex items-center justify-center shrink-0",
											active ? "border-primary" : "border-border",
										)}
									>
										{active && <div className="size-2 rounded-full bg-primary" />}
									</div>
									<span className={cn("text-sm font-bold", active ? "text-primary-dark" : "text-foreground")}>
										{label}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-subtle">{desc(naturalMinutes)}</span>
									<span className="text-sm font-extrabold tabular-nums">{mins} phút</span>
								</div>
							</label>
						)
					})}
				</div>

				<div className="flex items-center justify-between rounded-(--radius-card) bg-background px-4 py-3 border border-border">
					<span className="text-sm font-bold text-muted">Tổng</span>
					<div className="flex items-center gap-2">
						<StaticIcon name="timer-md" size="xs" />
						<span className="text-lg font-extrabold tabular-nums text-foreground">{displayMinutes} phút</span>
					</div>
				</div>

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

				{activeSameExam && (
					<Link
						to="/phong-thi/$sessionId"
						params={{ sessionId: activeSameExam.id }}
						search={{ examId: detail.exam.id }}
						className="btn btn-secondary text-sm w-full"
					>
						Tiếp tục làm bài
						<Icon name="lightning" size="xs" />
					</Link>
				)}

				<button
					type="button"
					onClick={handleStartClick}
					disabled={mutation.isPending}
					className={cn(
						"btn w-full text-base py-3",
						insufficient ? "btn-coin group" : activeSameExam ? "btn-destructive" : "btn-primary",
					)}
				>
					{insufficient ? (
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
							<span>{activeSameExam ? "Làm mới" : startLabel}</span>
							{!activeSameExam && <Icon name="play" size="xs" />}
						</>
					)}
				</button>
			</div>

			<ConfirmDialog
				open={confirmReset}
				title="Làm lại đề này?"
				description={
					<>
						Tiến trình bài thi hiện tại <strong className="text-foreground">sẽ bị huỷ</strong> và không hoàn
						xu. Bạn sẽ mở một lượt thi mới từ đầu.
					</>
				}
				warning="Hành động không thể hoàn tác"
				confirmLabel="Làm mới"
				cancelLabel="Quay lại"
				loadingLabel="Đang xử lý…"
				destructive
				isLoading={mutation.isPending}
				onConfirm={() => mutation.mutate()}
				onCancel={() => setConfirmReset(false)}
			/>

			<TopUpDialog open={showTopup} onClose={() => setShowTopup(false)} />
		</>
	)
}
