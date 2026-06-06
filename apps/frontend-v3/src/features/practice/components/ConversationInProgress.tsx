import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { useEffect, useRef, useState } from "react"
import { Icon, StaticIcon } from "#/components/Icon"
import { appConfigQuery } from "#/features/config/queries"
import { endConversation, submitConversationTurn } from "#/features/practice/actions"
import { ConversationHeader } from "#/features/practice/components/ConversationHeader"
import { ConversationReviewPanel } from "#/features/practice/components/ConversationReviewPopup"
import { ConversationScenarioCard } from "#/features/practice/components/ConversationScenarioCard"
import { ConversationSuggestions } from "#/features/practice/components/ConversationSuggestions"
import {
	ConversationTurnView,
	ConversationUserTurnLoading,
} from "#/features/practice/components/ConversationTurnView"
import { invalidateProgressQueries } from "#/features/practice/invalidate-progress"
import type { ConversationSessionDetail, ConversationTurn } from "#/features/practice/types"
import { useSpeechTranscriber } from "#/features/practice/use-speech-transcriber"
import { getAvatarUrl } from "#/lib/avatar"
import { useToast } from "#/lib/toast"
import { tokens } from "#/lib/tokens"
import { pickBoundaryEnglishVoice, pickEnglishVoice, speak, stopSpeaking, warmupTTS } from "#/lib/utils"

interface Props {
	session: ConversationSessionDetail
	onEnd: () => void
}

type MicState = "idle" | "listening" | "transcribing" | "thinking" | "speaking"
type SessionState = "active" | "completed"

const MAX_SECONDS = 30

export function ConversationInProgress({ session, onEnd }: Props) {
	const { data: configData } = useQuery(appConfigQuery)
	const { scenario } = session
	const [sessionId] = useState(session.session_id)
	const [turns, setTurns] = useState<ConversationTurn[]>(session.turns)
	const [mic, setMic] = useState<MicState>("idle")
	const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(() => pickBoundaryEnglishVoice())
	const aiName = scenario.character_name
	const [sessionState, setSessionState] = useState<SessionState>("active")
	const [showReview, setShowReview] = useState(false)
	const queryClient = useQueryClient()
	const [emptyWarning, setEmptyWarning] = useState(false)
	const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null)
	const [speakingCharIndex, setSpeakingCharIndex] = useState(-1)
	const feedbackCost = configData?.data.pricing.practice.feedback_cost_coins ?? 0
	const {
		elapsedSeconds: elapsed,
		start: startSpeechTranscription,
		stop: stopSpeechTranscription,
		abort: abortSpeechTranscription,
	} = useSpeechTranscriber(MAX_SECONDS)
	const scrollRef = useRef<HTMLDivElement>(null)
	const submittedRef = useRef(false)
	const endRequestedRef = useRef(false)

	useEffect(() => {
		if (voice) return
		const load = () => {
			const v = pickBoundaryEnglishVoice() ?? pickEnglishVoice()
			if (v) setVoice(v)
		}
		window.speechSynthesis?.addEventListener("voiceschanged", load)
		return () => window.speechSynthesis?.removeEventListener("voiceschanged", load)
	}, [voice])

	// Auto-speak opening turn with highlight
	const openingPlayed = useRef(false)
	useEffect(() => {
		if (openingPlayed.current || !voice) return
		const firstAi = turns.find((t) => t.role === "ai")
		if (!firstAi) return
		openingPlayed.current = true
		setSpeakingTurnId(firstAi.id)
		setSpeakingCharIndex(-1)
		setMic("speaking")
		setTimeout(() => {
			speak(firstAi.text, {
				rate: 0.9,
				voice,
				boundaryFallback: false,
				onBoundary: (ci) => setSpeakingCharIndex(ci),
				onEnd: () => {
					setMic("idle")
					setSpeakingTurnId(null)
					setSpeakingCharIndex(-1)
				},
			})
		}, 500)
	}, [voice, turns])

	const lastAi = [...turns].reverse().find((t) => t.role === "ai")
	const suggestions = lastAi?.suggested_words ?? []

	const turnsLen = useRef(turns.length)
	useEffect(() => {
		if (turns.length !== turnsLen.current || mic === "transcribing" || mic === "thinking") {
			turnsLen.current = turns.length
			const el = scrollRef.current
			if (el) el.scrollTop = el.scrollHeight
		}
	}, [mic, turns.length])

	const doSubmit = (text: string, confidence = 0.9) => {
		if (submittedRef.current) return
		submittedRef.current = true
		// Warm up TTS while waiting for API response
		warmupTTS()
		setTurns((prev) => [
			...prev,
			{ id: "pending-user", role: "user", text, ipa: null, feedback: null, suggested_words: [] },
		])
		setMic("thinking")
		turnMutation.mutate({ text, confidence })
	}

	const handleEnd = () => {
		if (endRequestedRef.current) return
		endRequestedRef.current = true
		abortSpeechTranscription()
		stopSpeaking()
		endConversation(sessionId).then(() => {
			setSessionState("completed")
			invalidateProgressQueries(queryClient)
		})
	}

	const handleReview = () => {
		const revealReview = () => {
			setShowReview(true)
			window.setTimeout(() => {
				document
					.getElementById("ai-conversation-feedback")
					?.scrollIntoView({ behavior: "smooth", block: "start" })
			}, 0)
		}
		revealReview()
	}

	const turnMutation = useMutation({
		mutationFn: (args: { text: string; confidence: number }) =>
			submitConversationTurn(sessionId, args.text, args.confidence),
		onSuccess: (res) => {
			setTurns((prev) => {
				const withoutPending = prev.filter((t) => t.id !== "pending-user")
				return [...withoutPending, res.data.user_turn, res.data.ai_turn]
			})
			setMic("speaking")
			const aiTurnId = res.data.ai_turn.id
			setSpeakingTurnId(aiTurnId)
			setSpeakingCharIndex(-1)
			setTimeout(() => {
				if (voice) {
					speak(res.data.ai_turn.text, {
						rate: 0.9,
						voice,
						boundaryFallback: false,
						onBoundary: (ci) => setSpeakingCharIndex(ci),
						onEnd: () => {
							setMic("idle")
							setSpeakingTurnId(null)
							setSpeakingCharIndex(-1)
						},
					})
				} else {
					setMic("idle")
				}
			}, 500)
		},
		onError: (error) => {
			setTurns((prev) => prev.filter((t) => t.id !== "pending-user"))
			setMic("idle")
			submittedRef.current = false

			if (error instanceof HTTPError) {
				const msg = error.message

				if (error.response.status === 503) {
					useToast.getState().add("AI đang bận, bạn thử gửi lại nhé.")
					return
				}

				if (error.response.status === 409) {
					setSessionState("completed")
					useToast.getState().add(msg || "Phiên hội thoại đã kết thúc.")
					return
				}

				useToast.getState().add(msg || `Lỗi server (${error.response.status}). Vui lòng thử lại.`)
				return
			}

			useToast.getState().add("Không gửi được câu trả lời. Vui lòng thử lại.")
		},
	})

	const handleMic = () => {
		if (mic === "speaking") {
			stopSpeaking()
			setMic("idle")
			setSpeakingTurnId(null)
			setSpeakingCharIndex(-1)
			return
		}
		if (mic === "listening") {
			setMic("transcribing")
			stopSpeechTranscription()
			return
		}
		if (mic !== "idle") return

		stopSpeaking()
		setEmptyWarning(false)
		submittedRef.current = false

		void startSpeechTranscription({
			language: "en-US",
			onStart: () => setMic("listening"),
			onProcessing: () => setMic("transcribing"),
			onResult: ({ transcript, confidence }) => {
				setEmptyWarning(false)
				doSubmit(transcript, confidence)
			},
			onEmpty: () => {
				if (submittedRef.current) return
				setMic("idle")
				setEmptyWarning(true)
				setTimeout(() => setEmptyWarning(false), 3000)
			},
			onError: (message) => {
				setMic("idle")
				useToast.getState().add(message)
			},
		})
	}

	useEffect(() => {
		return () => abortSpeechTranscription()
	}, [abortSpeechTranscription])

	const [showConfirmExit, setShowConfirmExit] = useState(false)

	const handleBack = () => {
		if (sessionState === "completed") {
			onEnd()
		} else {
			setShowConfirmExit(true)
		}
	}

	const confirmExit = () => {
		if (endRequestedRef.current) return
		endRequestedRef.current = true
		abortSpeechTranscription()
		stopSpeaking()
		endConversation(sessionId).then(onEnd)
	}

	// Auto-end session on browser tab close via fetch keepalive.
	// SPA navigation (unmount) only cleans up local resources — backend
	// auto-ends any stale active session when user starts a new one.
	useEffect(() => {
		const sid = sessionId
		const apiUrl = import.meta.env.VITE_API_URL ?? ""

		const handleBeforeUnload = () => {
			if (endRequestedRef.current) return
			endRequestedRef.current = true
			const token = tokens.getAccess()
			fetch(`${apiUrl}/practice/speaking/conversations/${sid}/end`, {
				method: "POST",
				keepalive: true,
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}).catch(() => {})
		}

		window.addEventListener("beforeunload", handleBeforeUnload)

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload)
			stopSpeaking()
		}
	}, [sessionId])

	return (
		<div className="flex flex-col h-screen bg-background">
			<ConversationHeader
				scenario={scenario}
				onEnd={handleEnd}
				onBack={handleBack}
				voice={voice}
				onVoiceChange={setVoice}
				completed={sessionState === "completed"}
			/>

			<div ref={scrollRef} className="flex-1 overflow-y-auto">
				<div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
					<ConversationScenarioCard scenario={scenario} />
					{turns.map((t) => (
						<ConversationTurnView
							key={t.id}
							turn={t}
							aiName={aiName}
							isSpeaking={speakingTurnId === t.id}
							highlightCharIndex={speakingTurnId === t.id ? speakingCharIndex : -1}
						/>
					))}
					{mic === "transcribing" && <ConversationUserTurnLoading />}
					{mic === "thinking" && (
						<div className="flex gap-3">
							<img
								src={getAvatarUrl(aiName)}
								alt={scenario.character_name}
								className="w-9 h-9 rounded-full bg-skill-speaking/20 border-2 border-skill-speaking/30 shrink-0 object-cover"
							/>
							<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface px-4 py-3">
								<div className="flex gap-1.5">
									<div className="w-2 h-2 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]" />
									<div
										className="w-2 h-2 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
										style={{ animationDelay: "0.2s" }}
									/>
									<div
										className="w-2 h-2 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
										style={{ animationDelay: "0.4s" }}
									/>
								</div>
							</div>
						</div>
					)}

					{/* Completion card */}
					{sessionState === "completed" &&
						(() => {
							const userTurnCount = turns.filter((t) => t.role === "user").length
							return (
								<div className="rounded-(--radius-card) border-2 border-b-4 border-skill-speaking/30 bg-surface p-6 text-center animate-[popIn_0.3s_ease-out]">
									<div className="w-12 h-12 rounded-full bg-skill-speaking/15 flex items-center justify-center mx-auto mb-3">
										<Icon name="check" size="md" className="text-skill-speaking" />
									</div>
									<p className="font-extrabold text-lg text-foreground">Hội thoại hoàn thành!</p>
									{userTurnCount > 0 ? (
										<>
											<p className="text-sm text-muted mt-1">
												Nhận phản hồi từ AI với gợi ý để cải thiện câu trả lời
												{feedbackCost > 0 ? (
													<span className="inline-flex items-center gap-1.5">
														&nbsp;· Tốn{" "}
														<StaticIcon name="coin" size="xs" className="h-3.5 w-auto -translate-y-0.5" />
														{feedbackCost} xu.
													</span>
												) : (
													"."
												)}
											</p>
											<div className="relative mt-4 inline-flex">
												<button
													type="button"
													onClick={handleReview}
													className="btn px-6 text-primary-foreground"
													style={
														{
															background: "var(--color-skill-speaking)",
															"--btn-shadow": "var(--color-skill-speaking-dark)",
														} as React.CSSProperties
													}
												>
													<Icon name="lightning" size="xs" />
													Xem đánh giá
												</button>
											</div>
										</>
									) : (
										<p className="text-sm text-muted mt-1">
											Hãy thử lại và nói ít nhất một câu để nhận đánh giá.
										</p>
									)}
								</div>
							)
						})()}
					{showReview && (
						<ConversationReviewPanel
							sessionId={sessionId}
							turnCount={turns.filter((t) => t.role === "user").length}
						/>
					)}
				</div>
			</div>

			{/* Footer — only show when active */}
			{sessionState !== "completed" && (
				<div className="border-t-2 border-border bg-surface shrink-0">
					<div className="max-w-2xl mx-auto px-6 py-4 space-y-4">
						<ConversationSuggestions words={suggestions} />
						<div className="flex flex-col items-center gap-1.5">
							{mic === "listening" ? (
								<>
									<div className="relative flex items-center justify-center w-28 h-28">
										<div className="absolute inset-0 rounded-full bg-destructive/25 animate-[micPulse_1.5s_ease-in-out_infinite]" />
										<button
											type="button"
											onClick={handleMic}
											className="relative w-16 h-16 rounded-full bg-destructive text-primary-foreground flex items-center justify-center shadow-[0_4px_0_var(--color-destructive-dark)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-destructive-dark)] transition"
										>
											<div className="w-5 h-5 rounded-sm bg-primary-foreground" />
										</button>
									</div>
									<p className="text-sm font-bold text-destructive tabular-nums">
										{elapsed}s / {MAX_SECONDS}s
									</p>
								</>
							) : mic === "speaking" ? (
								<>
									<div className="relative flex items-center justify-center w-28 h-28">
										<div className="absolute inset-0 rounded-full bg-skill-speaking/20 animate-[micPulse_1.5s_ease-in-out_infinite]" />
										<button
											type="button"
											onClick={handleMic}
											className="relative w-16 h-16 rounded-full bg-skill-speaking text-primary-foreground flex items-center justify-center shadow-[0_4px_0_var(--color-skill-speaking-dark)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-skill-speaking-dark)] transition"
										>
											<Icon name="volume" size="md" />
										</button>
									</div>
									<p className="text-xs font-bold text-skill-speaking">Đang phát · Nhấn để bỏ qua</p>
								</>
							) : (
								<>
									<button
										type="button"
										onClick={handleMic}
										disabled={mic === "thinking" || mic === "transcribing"}
										className="w-16 h-16 rounded-full flex items-center justify-center transition shrink-0 disabled:opacity-50 bg-surface text-foreground border-2 border-b-4 border-border hover:border-skill-speaking active:translate-y-[2px] active:border-b-2"
									>
										<Icon name="mic" size="md" />
									</button>
									<p className="text-xs font-bold text-muted">
										{mic === "thinking" || mic === "transcribing" ? "Đang xử lý…" : "Nhấn để nói"}
									</p>
									{emptyWarning && (
										<p className="text-xs font-bold text-warning animate-[fadeIn_0.2s_ease-out] mt-1">
											Không nghe rõ, vui lòng thử lại.
										</p>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{showConfirmExit && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
					<div className="w-full max-w-sm rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-6 shadow-xl mx-4 animate-[popIn_0.25s_ease-out]">
						<h3 className="font-extrabold text-lg text-foreground mb-2">Kết thúc hội thoại?</h3>
						<p className="text-sm text-muted mb-5">
							Hội thoại chưa hoàn thành. Bạn có muốn kết thúc và thoát không?
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setShowConfirmExit(false)}
								className="btn btn-secondary flex-1"
							>
								Tiếp tục
							</button>
							<button
								type="button"
								onClick={confirmExit}
								className="btn flex-1 text-primary-foreground"
								style={
									{
										background: "var(--color-destructive)",
										"--btn-shadow": "var(--color-destructive-dark)",
									} as React.CSSProperties
								}
							>
								Kết thúc
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
