// ChatInput — form nhập tin nhắn với voice + image attachment.

import { ImagePlus, Mic, MicOff, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { sendMessage } from "#/features/ai-chat/lib/store"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

// Web Speech API minimal types
type SpeechRecognitionEvent = {
	resultIndex: number
	results: { length: number; [i: number]: { [j: number]: { transcript: string } } }
}
interface SpeechRecognitionLike {
	lang: string
	interimResults: boolean
	continuous: boolean
	onresult: ((e: SpeechRecognitionEvent) => void) | null
	onend: (() => void) | null
	onerror: (() => void) | null
	start(): void
	stop(): void
	abort(): void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function ChatInput({ disabled }: { disabled: boolean }) {
	const [value, setValue] = useState("")
	const [imageUrl, setImageUrl] = useState<string | null>(null)
	const [recording, setRecording] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
	const baseTextRef = useRef("")

	useEffect(() => {
		return () => recognitionRef.current?.abort()
	}, [])

	function submit(e: React.FormEvent) {
		e.preventDefault()
		const text = value.trim()
		if ((!text && !imageUrl) || disabled) return
		void sendMessage(text, imageUrl ?? undefined)
		setValue("")
		setImageUrl(null)
	}

	function pickImage(file: File | null | undefined) {
		if (!file || !file.type.startsWith("image/")) return
		const reader = new FileReader()
		reader.onload = () => {
			if (typeof reader.result === "string") setImageUrl(reader.result)
		}
		reader.readAsDataURL(file)
	}

	function toggleVoice() {
		if (recording) {
			recognitionRef.current?.stop()
			return
		}
		const SR =
			typeof window !== "undefined"
				? ((
						window as unknown as {
							SpeechRecognition?: SpeechRecognitionCtor
							webkitSpeechRecognition?: SpeechRecognitionCtor
						}
					).SpeechRecognition ??
					(window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
						.webkitSpeechRecognition)
				: undefined
		if (!SR) return
		const rec = new SR()
		rec.lang = "vi-VN"
		rec.interimResults = true
		rec.continuous = false
		baseTextRef.current = value
		rec.onresult = (event) => {
			let transcript = ""
			for (let i = event.resultIndex; i < event.results.length; i++)
				transcript += event.results[i]?.[0]?.transcript ?? ""
			setValue((baseTextRef.current ? baseTextRef.current + " " : "") + transcript)
		}
		rec.onend = () => {
			setRecording(false)
			recognitionRef.current = null
		}
		rec.onerror = () => {
			setRecording(false)
			recognitionRef.current = null
		}
		recognitionRef.current = rec
		rec.start()
		setRecording(true)
	}

	const voiceSupported =
		typeof window !== "undefined" &&
		("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

	return (
		<form onSubmit={submit} className="space-y-2 border-t px-3 py-2">
			{imageUrl && (
				<div className="relative inline-block">
					<img
						src={imageUrl}
						alt="Đính kèm"
						className="h-20 w-auto rounded-lg border object-cover"
					/>
					<button
						type="button"
						onClick={() => setImageUrl(null)}
						aria-label="Bỏ ảnh"
						className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow"
					>
						<X className="size-3" />
					</button>
				</div>
			)}
			<div className="flex items-center gap-1.5">
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={(e) => pickImage(e.target.files?.[0])}
				/>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					aria-label="Đính kèm ảnh"
					disabled={disabled}
					className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
				>
					<ImagePlus className="size-4" />
				</button>
				{voiceSupported && (
					<button
						type="button"
						onClick={toggleVoice}
						aria-label={recording ? "Dừng ghi âm" : "Ghi âm giọng nói"}
						disabled={disabled}
						className={cn(
							"inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
							recording
								? "bg-destructive/10 text-destructive"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						{recording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
					</button>
				)}
				<input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder={recording ? "Đang nghe…" : "Nhập câu hỏi…"}
					disabled={disabled}
					className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
				/>
				<Button type="submit" size="icon" disabled={disabled || (!value.trim() && !imageUrl)}>
					<Send className="size-4" />
				</Button>
			</div>
		</form>
	)
}
