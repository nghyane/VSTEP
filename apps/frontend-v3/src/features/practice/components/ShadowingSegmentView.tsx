import { useMutation } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { useState } from "react"
import { Icon } from "#/components/Icon"
import { getPronunciationReview, type PronunciationReview } from "#/features/practice/actions"
import { ShadowingWordChips } from "#/features/practice/components/ShadowingWordChips"
import type { ShadowingSegment } from "#/features/practice/types"
import { cn, translateText, type WordCompareResult } from "#/lib/utils"

export interface ShadowingAttemptResult {
	transcript: string
	wordResults: WordCompareResult[]
	correctCount: number
	accuracyPercent: number | null
}

interface Props {
	segment: ShadowingSegment
	isSpeaking: boolean
	speakingCharIndex: number
	onListen: () => void
	attempt: ShadowingAttemptResult | null
}

function HighlightText({ text, charIndex }: { text: string; charIndex: number }) {
	const words = text.split(/(\s+)/)
	let pos = 0
	return (
		<p className="text-lg font-bold leading-relaxed">
			{words.map((w) => {
				const start = pos
				pos += w.length
				if (/^\s+$/.test(w)) return w
				return (
					<span
						key={`${start}`}
						className={cn(
							"transition-colors duration-200",
							charIndex >= start ? "text-foreground" : "text-muted/40",
						)}
					>
						{w}
					</span>
				)
			})}
		</p>
	)
}

function TranslateButton({ text }: { text: string }) {
	const [translation, setTranslation] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const toggle = async () => {
		if (translation) {
			setTranslation(null)
			return
		}
		setLoading(true)
		setTranslation(await translateText(text))
		setLoading(false)
	}
	return (
		<div>
			<button
				type="button"
				onClick={toggle}
				disabled={loading}
				className={cn(
					"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-(--radius-button) border-2 border-b-4 text-xs font-bold transition mt-2 active:translate-y-[1px] active:border-b-2",
					translation
						? "border-skill-speaking/40 bg-skill-speaking/10 text-skill-speaking"
						: "border-border bg-surface text-subtle hover:text-foreground",
				)}
			>
				<Icon name="swap" size="xs" />
				{loading ? "Đang dịch..." : translation ? "Ẩn dịch" : "Dịch"}
			</button>
			{translation && <p className="text-sm text-muted italic mt-1.5 px-1">{translation}</p>}
		</div>
	)
}

function ReviewPopup({
	review,
	isError,
	isServiceDown,
	onRetry,
	onClose,
}: {
	review: PronunciationReview | null
	isError: boolean
	isServiceDown: boolean
	onRetry: () => void
	onClose: () => void
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
			<div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-6 shadow-xl mx-4 animate-[popIn_0.25s_ease-out]">
				<div className="flex items-center justify-between mb-4">
					<h2 className="font-extrabold text-lg text-foreground">AI nhận xét phát âm</h2>
					<button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground transition">
						<Icon name="close" size="sm" />
					</button>
				</div>
				{isError ? (
					<div className="text-center py-6">
						<p className="text-sm text-destructive mb-3">
							{isServiceDown
								? "AI tạm thời không phản hồi. Vui lòng thử lại sau."
								: "Không thể tải nhận xét."}
						</p>
						<button type="button" onClick={onRetry} className="btn btn-secondary px-6">
							Thử lại
						</button>
					</div>
				) : !review ? (
					<div className="text-center py-8">
						<div className="flex justify-center gap-1.5 mb-3">
							<div className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]" />
							<div
								className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
								style={{ animationDelay: "0.2s" }}
							/>
							<div
								className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
								style={{ animationDelay: "0.4s" }}
							/>
						</div>
						<p className="text-sm font-bold text-muted">AI đang phân tích...</p>
					</div>
				) : (
					<div className="space-y-3">
						<div className="rounded-(--radius-card) border-2 border-b-4 border-skill-speaking/30 bg-skill-speaking/5 p-4">
							<p className="text-xs font-extrabold text-skill-speaking uppercase tracking-wider mb-1.5">
								Phát âm
							</p>
							<p className="text-sm text-foreground">{review.pronunciation}</p>
						</div>
						<div className="rounded-(--radius-card) border-2 border-b-4 border-info/30 bg-info/5 p-4">
							<p className="text-xs font-extrabold text-info uppercase tracking-wider mb-1.5">Ngữ điệu</p>
							<p className="text-sm text-foreground">{review.intonation}</p>
						</div>
						<div className="rounded-(--radius-card) border-2 border-b-4 border-warning/30 bg-warning/5 p-4">
							<p className="text-xs font-extrabold text-warning uppercase tracking-wider mb-1.5">Mẹo</p>
							<p className="text-sm text-foreground">{review.tip}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export function ShadowingSegmentView({ segment, isSpeaking, speakingCharIndex, onListen, attempt }: Props) {
	const [showIpa, setShowIpa] = useState(false)
	const [showReview, setShowReview] = useState(false)
	const accuracyPercent = attempt?.accuracyPercent ?? null

	const reviewMutation = useMutation({
		mutationFn: () => getPronunciationReview(segment.text, attempt?.transcript ?? ""),
	})

	const handleReview = () => {
		setShowReview(true)
		reviewMutation.mutate()
	}

	return (
		<div className="space-y-4">
			{/* Sentence card */}
			<div className="card p-5">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold text-muted">#{segment.index + 1}</span>
						<span className="text-xs text-muted">{segment.word_count} từ</span>
					</div>
					<div className="flex items-center gap-2">
						{/* Listen button — small icon */}
						<button
							type="button"
							onClick={onListen}
							className={cn(
								"p-1 transition",
								isSpeaking ? "text-skill-speaking" : "text-muted hover:text-skill-speaking",
							)}
						>
							<Icon name="volume" size="xs" />
						</button>
						<button
							type="button"
							onClick={() => setShowIpa((v) => !v)}
							className={cn(
								"text-xs font-bold transition px-2 py-0.5 rounded",
								showIpa ? "text-skill-speaking bg-skill-speaking/10" : "text-muted hover:text-foreground",
							)}
						>
							IPA
						</button>
					</div>
				</div>

				{isSpeaking ? (
					<HighlightText text={segment.text} charIndex={speakingCharIndex} />
				) : (
					<p className="text-lg font-bold text-foreground leading-relaxed">{segment.text}</p>
				)}

				{showIpa && <p className="mt-3 text-sm text-subtle font-mono leading-relaxed">{segment.ipa}</p>}

				<TranslateButton text={segment.text} />
			</div>

			{/* Attempt result */}
			{attempt && (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-sm font-bold text-muted">
							{attempt.correctCount}/{segment.word_count} từ đúng
						</p>
						<span
							className={cn(
								"text-xs font-bold px-2 py-0.5 rounded-full",
								accuracyPercent === null
									? "bg-border/30 text-muted"
									: accuracyPercent >= 70
									? "bg-success/15 text-success"
									: accuracyPercent >= 40
										? "bg-warning/15 text-warning"
										: "bg-destructive/15 text-destructive",
							)}
						>
							{accuracyPercent !== null ? `${accuracyPercent}%` : "--"}
						</span>
					</div>

					<div className="card p-4">
						<p className="text-xs text-muted mb-1">Bạn đã nói:</p>
						<p className="text-sm font-bold text-foreground italic">"{attempt.transcript}"</p>
					</div>

					<ShadowingWordChips words={attempt.wordResults} />

					<button
						type="button"
						onClick={handleReview}
						className="w-full flex items-center justify-center gap-2 py-3 rounded-(--radius-button) border-2 border-b-4 border-skill-speaking/30 bg-skill-speaking/10 text-skill-speaking font-bold text-sm transition hover:bg-skill-speaking/20 active:translate-y-[1px] active:border-b-2"
					>
						<Icon name="lightning" size="xs" />
						Nhờ AI nhận xét phát âm
					</button>
				</div>
			)}

			{showReview && (
				<ReviewPopup
					review={reviewMutation.data?.data ?? null}
					isError={reviewMutation.isError}
					isServiceDown={
						reviewMutation.error instanceof HTTPError && reviewMutation.error.response.status === 503
					}
					onRetry={() => reviewMutation.mutate()}
					onClose={() => setShowReview(false)}
				/>
			)}
		</div>
	)
}
