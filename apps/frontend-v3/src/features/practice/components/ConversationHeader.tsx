import { useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import type { ConversationScenario } from "#/features/practice/types"
import { extractFirstName, getAvatarUrl } from "#/lib/avatar"
import { cn, getEnglishVoices, shortVoiceName, speak, stopSpeaking } from "#/lib/utils"

interface Props {
	scenario: ConversationScenario
	onEnd: () => void
	onBack: () => void
	voice: SpeechSynthesisVoice | undefined
	onVoiceChange: (v: SpeechSynthesisVoice) => void
	completed?: boolean
}

function voiceDisplayName(voice: SpeechSynthesisVoice | undefined): string {
	return voice ? extractFirstName(shortVoiceName(voice.name)) : "Chọn giọng"
}

const PREVIEW_TEXT = "Hello! Nice to meet you."

export function ConversationHeader({ scenario, onEnd, onBack, voice, onVoiceChange, completed }: Props) {
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
	const [open, setOpen] = useState(false)
	const [playing, setPlaying] = useState<string | null>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const selectedVoiceName = voiceDisplayName(voice)

	useEffect(() => {
		const load = () => setVoices(getEnglishVoices())
		load()
		window.speechSynthesis?.addEventListener("voiceschanged", load)
		return () => window.speechSynthesis?.removeEventListener("voiceschanged", load)
	}, [])

	// Close on click outside
	useEffect(() => {
		if (!open) return
		const handler = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false)
				stopSpeaking()
				setPlaying(null)
			}
		}
		document.addEventListener("mousedown", handler)
		return () => document.removeEventListener("mousedown", handler)
	}, [open])

	const preview = (v: SpeechSynthesisVoice) => {
		stopSpeaking()
		if (playing === v.name) {
			setPlaying(null)
			return
		}
		setPlaying(v.name)
		speak(PREVIEW_TEXT, { voice: v, rate: 0.9, onEnd: () => setPlaying(null) })
	}

	const select = (v: SpeechSynthesisVoice) => {
		stopSpeaking()
		setPlaying(null)
		onVoiceChange(v)
		setOpen(false)
	}

	return (
		<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-3 shrink-0">
			<button type="button" onClick={onBack} className="p-1.5 hover:opacity-70 shrink-0">
				<Icon name="back" size="sm" className="text-muted" />
			</button>

			<div className="flex items-center gap-3 min-w-0 flex-1">
				<div className="relative shrink-0">
					<img
						src={getAvatarUrl(scenario.character_name)}
						alt={scenario.character_name}
						className="w-10 h-10 rounded-full bg-skill-speaking/20 border-2 border-skill-speaking/30 object-cover"
					/>
					<div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-extrabold text-foreground truncate">{scenario.character_name}</p>
					<div className="flex items-center gap-2 min-w-0">
						<span className="text-[10px] font-bold text-skill-speaking bg-skill-speaking/15 px-1.5 py-0.5 rounded shrink-0">
							{scenario.level}
						</span>
						<p className="text-xs text-subtle truncate">{scenario.title}</p>
					</div>
				</div>
			</div>

			{/* Voice picker */}
			<div className="relative shrink-0" ref={panelRef}>
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					className={cn(
						"flex items-center gap-2 pl-1.5 pr-3 h-9 rounded-(--radius-button) border-2 border-b-4 bg-surface text-xs font-bold transition shrink-0 active:translate-y-[1px] active:border-b-2",
						open
							? "border-skill-speaking text-skill-speaking"
							: "border-border text-muted hover:text-foreground",
					)}
				>
					<Icon name="volume" size="xs" />
					<span className="hidden sm:inline max-w-24 truncate">{selectedVoiceName}</span>
				</button>

				{open && (
					<div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto rounded-(--radius-card) border-2 border-border bg-surface shadow-lg z-50 animate-[menuIn_0.15s_ease-out]">
						<div className="px-3 py-2 border-b border-border">
							<p className="text-xs font-bold text-muted">Chọn giọng đọc</p>
						</div>
						{voices.map((v) => {
							const isActive = voice?.name === v.name
							const isPlaying = playing === v.name
							const vName = voiceDisplayName(v)
							return (
								<div
									key={v.name}
									className={cn(
										"flex items-center gap-2 px-3 py-2.5 transition",
										isActive ? "bg-skill-speaking/10" : "hover:bg-background",
									)}
								>
									{/* Avatar */}
									<img
										src={getAvatarUrl(vName)}
										alt={vName}
										className="w-8 h-8 rounded-full bg-skill-speaking/20 object-cover shrink-0"
									/>

									{/* Voice info + select */}
									<button type="button" onClick={() => select(v)} className="flex-1 min-w-0 text-left">
										<p
											className={cn(
												"text-sm font-bold truncate",
												isActive ? "text-skill-speaking" : "text-foreground",
											)}
										>
											{vName}
										</p>
										<p className="text-[10px] text-subtle">{v.lang}</p>
									</button>

									{/* Preview button */}
									<button
										type="button"
										onClick={() => preview(v)}
										className={cn(
											"w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition",
											isPlaying
												? "border-skill-speaking bg-skill-speaking text-primary-foreground"
												: "border-border text-muted hover:border-skill-speaking hover:text-skill-speaking",
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

			{completed ? (
				<div className="flex items-center gap-2 px-3 h-9 rounded-(--radius-button) border-2 border-b-4 border-success/30 bg-success/10 text-xs font-bold text-success shrink-0">
					<Icon name="check" size="xs" />
					<span>Hoàn thành</span>
				</div>
			) : (
				<button
					type="button"
					onClick={onEnd}
					className="flex items-center gap-2 px-3 h-9 rounded-(--radius-button) border-2 border-b-4 border-border bg-surface text-xs font-bold text-muted hover:text-foreground transition shrink-0 active:translate-y-[1px] active:border-b-2"
				>
					<Icon name="logout" size="xs" />
					<span className="hidden sm:inline">Kết thúc</span>
				</button>
			)}
		</div>
	)
}
