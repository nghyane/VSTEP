import { useMutation } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { endConversation, submitConversationTurn } from "#/features/practice/actions"
import { ConversationHeader } from "#/features/practice/components/ConversationHeader"
import { ConversationReviewPopup } from "#/features/practice/components/ConversationReviewPopup"
import { ConversationScenarioCard } from "#/features/practice/components/ConversationScenarioCard"
import { ConversationSuggestions } from "#/features/practice/components/ConversationSuggestions"
import { ConversationTurnView } from "#/features/practice/components/ConversationTurnView"
import type { ConversationSessionDetail, ConversationTurn } from "#/features/practice/types"
import { extractFirstName, getAvatarUrl } from "#/lib/avatar"
import { useToast } from "#/lib/toast"
import { tokens } from "#/lib/tokens"
import {
	pickEnglishVoice,
	shortVoiceName,
	speak,
	speechRecognitionNetworkMessage,
	stopSpeaking,
	warmupTTS,
} from "#/lib/utils"

interface Props {
	session: ConversationSessionDetail
	onEnd: () => void
}

type MicState = "idle" | "listening" | "thinking" | "speaking"
type SessionState = "active" | "completed"

const MAX_SECONDS = 30

export function ConversationInProgress({ session, onEnd }: Props) {
	const { scenario } = session
	const [sessionId] = useState(session.session_id)
	const [turns, setTurns] = useState<ConversationTurn[]>(session.turns)
	const [mic, setMic] = useState<MicState>("idle")
	const [elapsed, setElapsed] = useState(0)
	const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(() => pickEnglishVoice())
	const aiName = voice ? extractFirstName(shortVoiceName(voice.name)) : scenario.character_name
	const [sessionState, setSessionState] = useState<SessionState>("active")
	const [showReview, setShowReview] = useState(false)
	const [emptyWarning, setEmptyWarning] = useState(false)
	const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null)
	const [speakingCharIndex, setSpeakingCharIndex] = useState(-1)
	const scrollRef = useRef<HTMLDivElement>(null)
	const recognitionRef = useRef<{ stop: () => void } | null>(null)
	const timerRef = useRef<number | null>(null)
	const transcriptRef = useRef("")
	const submittedRef = useRef(false)
	const stoppedRef = useRef(false)
	const autoRestartRef = useRef(0)

	useEffect(() => {
		if (voice) return
		const load = () => {
			const v = pickEnglishVoice()
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
		if (turns.length !== turnsLen.current) {
			turnsLen.current = turns.length
			const el = scrollRef.current
			if (el) el.scrollTop = el.scrollHeight
		}
	})

	const doSubmit = (text: string) => {
		if (submittedRef.current) return
		submittedRef.current = true
		// Warm up TTS while waiting for API response
		warmupTTS()
		setTurns((prev) => [
			...prev,
			{ id: "pending-user", role: "user", text, ipa: null, feedback: null, suggested_words: [] },
		])
		setMic("thinking")
		turnMutation.mutate({ text, confidence: 0.9 })
	}

	const handleEnd = () => {
		stopSpeaking()
		endConversation(sessionId).then(() => setSessionState("completed"))
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
		onError: async (error) => {
			// Remove optimistic pending turn so user can re-record.
			setTurns((prev) => prev.filter((t) => t.id !== "pending-user"))
			setMic("idle")
			submittedRef.current = false

			if (error instanceof HTTPError) {
				const body = (await error.response.json().catch(() => null)) as { message?: string } | null
				const msg = body?.message

				// 503: AI service unavailable → show retry message
				if (error.response.status === 503) {
					useToast.getState().add(msg ?? "AI tạm thời không phản hồi. Vui lòng thử lại sau.")
					return
				}

				// 409: session already ended
				if (error.response.status === 409) {
					setSessionState("completed")
					useToast.getState().add(msg ?? "Phiên hội thoại đã kết thúc.")
					return
				}

				// Other HTTP errors — show backend message
				useToast.getState().add(msg ?? `Lỗi server (${error.response.status}). Vui lòng thử lại.`)
				return
			}

			// Network error, timeout, or other non-HTTP failure
			useToast.getState().add("Không gửi được câu trả lời. Vui lòng thử lại.")
		},
	})

	const cleanup = () => {
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
	}

	const handleMic = () => {
		if (mic === "speaking") {
			stopSpeaking()
			setMic("idle")
			setSpeakingTurnId(null)
			setSpeakingCharIndex(-1)
			return
		}
		if (mic === "listening") {
			stoppedRef.current = true
			cleanup()
			recognitionRef.current?.stop()
			return
		}
		if (mic !== "idle") return

		stopSpeaking()
		setEmptyWarning(false)

		const SR = window.SpeechRecognition || window.webkitSpeechRecognition
		if (!SR) {
			useToast.getState().add("Trình duyệt này không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.")
			return
		}

		const recognition = new SR()
		recognition.lang = "en-US"
		recognition.continuous = true
		recognition.interimResults = true
		recognition.maxAlternatives = 1
		recognitionRef.current = recognition
		transcriptRef.current = ""
		submittedRef.current = false
		stoppedRef.current = false
		autoRestartRef.current = 0
		setElapsed(0)

		recognition.onresult = (e: Event) => {
			const evt = e as unknown as { results: ArrayLike<{ 0: { transcript: string } }> }
			let full = ""
			for (let i = 0; i < evt.results.length; i++) {
				full += evt.results[i][0].transcript
			}
			transcriptRef.current = full
		}

		recognition.onerror = (e: Event) => {
			const err = e as unknown as { error: string; message?: string }
			if (
				err.error === "not-allowed" ||
				err.error === "service-not-allowed" ||
				err.error === "audio-capture"
			) {
				stoppedRef.current = true
				recognition.abort()
				setMic("idle")
				cleanup()
				useToast.getState().add("Không thể truy cập microphone. Kiểm tra cài đặt trình duyệt.")
				return
			}
			if (err.error === "network") {
				stoppedRef.current = true
				recognition.abort()
				setMic("idle")
				cleanup()
				useToast.getState().add(speechRecognitionNetworkMessage(navigator.userAgent, navigator.onLine))
				return
			}
			// "no-speech" / "aborted": recoverable, onend will auto-restart (capped)
		}

		recognition.onend = () => {
			if (!stoppedRef.current && !submittedRef.current) {
				// Auto-restart only if we have less than 3 consecutive restarts
				// (browsers may auto-stop recognition on silence, especially Edge/Mac).
				autoRestartRef.current += 1
				if (autoRestartRef.current <= 3) {
					try {
						recognition.start()
						return
					} catch {
						cleanup()
						setMic("idle")
						return
					}
				}
			}
			cleanup()
			const text = transcriptRef.current.trim()
			if (text && !submittedRef.current) {
				setEmptyWarning(false)
				doSubmit(text)
			} else if (!submittedRef.current) {
				setMic("idle")
				setEmptyWarning(true)
				setTimeout(() => setEmptyWarning(false), 3000)
			}
		}

		try {
			recognition.start()
			setMic("listening")
			const startTime = Date.now()
			timerRef.current = window.setInterval(() => {
				const sec = Math.floor((Date.now() - startTime) / 1000)
				setElapsed(sec)
				if (sec >= MAX_SECONDS) {
					stoppedRef.current = true
					cleanup()
					recognitionRef.current?.stop()
					const text = transcriptRef.current.trim()
					if (text && !submittedRef.current) {
						doSubmit(text)
					} else {
						setMic("idle")
					}
				}
			}, 200)
		} catch {
			setMic("idle")
		}
	}

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
			recognitionRef.current?.stop()
		}
	}, [])

	const [showConfirmExit, setShowConfirmExit] = useState(false)

	const handleBack = () => {
		if (sessionState === "completed") {
			onEnd()
		} else {
			setShowConfirmExit(true)
		}
	}

	const confirmExit = () => {
		stopSpeaking()
		endConversation(sessionId).then(onEnd)
	}

	// Auto-end session on browser tab close via fetch keepalive.
	// SPA navigation (unmount) only cleans up local resources — backend
	// auto-ends any stale active session when user starts a new one.
	const endedRef = useRef(false)
	useEffect(() => {
		const sid = sessionId
		const apiUrl = import.meta.env.VITE_API_URL ?? ""

		const handleBeforeUnload = () => {
			if (endedRef.current) return
			endedRef.current = true
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
							scenario={scenario}
							aiName={aiName}
							isSpeaking={speakingTurnId === t.id}
							highlightCharIndex={speakingTurnId === t.id ? speakingCharIndex : -1}
						/>
					))}
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
												Nhận phản hồi từ AI với gợi ý để cải thiện câu trả lời.
											</p>
											<button
												type="button"
												onClick={() => setShowReview(true)}
												className="btn mt-4 px-6 text-primary-foreground"
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
										</>
									) : (
										<p className="text-sm text-muted mt-1">
											Hãy thử lại và nói ít nhất một câu để nhận đánh giá.
										</p>
									)}
								</div>
							)
						})()}
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
										disabled={mic === "thinking"}
										className="w-16 h-16 rounded-full flex items-center justify-center transition shrink-0 disabled:opacity-50 bg-surface text-foreground border-2 border-b-4 border-border hover:border-skill-speaking active:translate-y-[2px] active:border-b-2"
									>
										<Icon name="mic" size="md" />
									</button>
									<p className="text-xs font-bold text-muted">
										{mic === "thinking" ? "Đang xử lý…" : "Nhấn để nói"}
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

			{showReview && (
				<ConversationReviewPopup
					sessionId={sessionId}
					turnCount={turns.filter((t) => t.role === "user").length}
					onClose={() => setShowReview(false)}
				/>
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
