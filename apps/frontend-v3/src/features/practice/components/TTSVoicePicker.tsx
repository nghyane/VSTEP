import { useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { extractFirstName } from "#/lib/avatar"
import { useToast } from "#/lib/toast"
import { cn, getEnglishVoices, shortVoiceName, speak, stopSpeaking } from "#/lib/utils"

interface Props {
	voice: SpeechSynthesisVoice | undefined
	onVoiceChange: (voice: SpeechSynthesisVoice) => void
	accentClassName: string
}

const PREVIEW_TEXT = "Hello! Nice to meet you."
const VOICE_ERROR_MESSAGE =
	"Giọng đọc này không phát được trên trình duyệt hiện tại. Vui lòng chọn giọng khác."

function displayName(voice: SpeechSynthesisVoice | undefined): string {
	return voice ? extractFirstName(shortVoiceName(voice.name)) : "Giọng đọc"
}

export function TTSVoicePicker({ voice, onVoiceChange, accentClassName }: Props) {
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
	const [open, setOpen] = useState(false)
	const [playing, setPlaying] = useState<string | null>(null)
	const panelRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const load = () => setVoices(getEnglishVoices())
		load()
		window.speechSynthesis?.addEventListener("voiceschanged", load)
		return () => window.speechSynthesis?.removeEventListener("voiceschanged", load)
	}, [])

	useEffect(() => {
		if (!open) return
		const handler = (event: MouseEvent) => {
			if (!panelRef.current?.contains(event.target as Node)) {
				setOpen(false)
				stopSpeaking()
				setPlaying(null)
			}
		}
		document.addEventListener("mousedown", handler)
		return () => document.removeEventListener("mousedown", handler)
	}, [open])

	const preview = (nextVoice: SpeechSynthesisVoice) => {
		stopSpeaking()
		if (playing === nextVoice.name) {
			setPlaying(null)
			return
		}
		setPlaying(nextVoice.name)
		speak(PREVIEW_TEXT, {
			voice: nextVoice,
			rate: 0.9,
			onEnd: () => setPlaying(null),
			onError: () => useToast.getState().add(VOICE_ERROR_MESSAGE),
		})
	}

	const select = (nextVoice: SpeechSynthesisVoice) => {
		stopSpeaking()
		setPlaying(null)
		onVoiceChange(nextVoice)
		setOpen(false)
	}

	return (
		<div className="relative shrink-0" ref={panelRef}>
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className={cn(
					"flex h-9 items-center gap-2 rounded-(--radius-button) border-2 border-b-4 bg-surface pl-1.5 pr-3 text-xs font-bold transition active:translate-y-[1px] active:border-b-2",
					open ? accentClassName : "border-border text-muted hover:text-foreground",
				)}
				title="Chọn giọng đọc"
			>
				<Icon name="volume" size="xs" />
				<span className="hidden max-w-20 truncate sm:inline">{displayName(voice)}</span>
			</button>

			{open && (
				<div className="absolute right-0 top-full z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-(--radius-card) border-2 border-border bg-surface shadow-lg animate-[menuIn_0.15s_ease-out]">
					<div className="border-b border-border px-3 py-2">
						<p className="text-xs font-bold text-muted">Chọn giọng đọc</p>
					</div>
					{voices.map((nextVoice) => {
						const isActive = voice?.name === nextVoice.name
						const isPlaying = playing === nextVoice.name
						const name = displayName(nextVoice)
						return (
							<div
								key={nextVoice.name}
								className={cn(
									"flex items-center gap-2 px-3 py-2.5 transition",
									isActive ? "bg-primary/5" : "hover:bg-background",
								)}
							>
								<button type="button" onClick={() => select(nextVoice)} className="min-w-0 flex-1 text-left">
									<p
										className={cn(
											"truncate text-sm font-bold",
											isActive ? "text-primary" : "text-foreground",
										)}
									>
										{name}
									</p>
									<p className="text-[10px] text-subtle">{nextVoice.lang}</p>
								</button>
								<button
									type="button"
									onClick={() => preview(nextVoice)}
									className={cn(
										"flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition",
										isPlaying
											? "border-primary bg-primary text-primary-foreground"
											: "border-border text-muted hover:border-primary hover:text-primary",
									)}
									title="Nghe thử"
								>
									<Icon name={isPlaying ? "volume" : "play"} size="xs" />
								</button>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
