// FloatingChatDock — FAB ở góc phải dưới + popup chat với multi-session.
// Mount 1 lần ở _app layout. State từ lib/ai-chat/store (persist localStorage).

import { ImagePlus, MessageSquarePlus, Mic, MicOff, PanelLeft, Send, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ChatGptIcon } from "#/components/common/ChatGptIcon"
import {
	type ChatMessage,
	type ChatSession,
	closeChat,
	createSession,
	deleteSession,
	selectSession,
	sendMessage,
	toggleChat,
} from "#/lib/ai-chat/store"
import { useAiChat } from "#/lib/ai-chat/use-ai-chat"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

export function FloatingChatDock() {
	const { isOpen, sessions, activeId, pending, bottomOffset } = useAiChat()
	const active = sessions.find((s) => s.id === activeId) ?? null

	useEffect(() => {
		if (!isOpen) return
		function onPointerDown(e: PointerEvent) {
			const target = e.target as Element | null
			if (target?.closest("[data-ai-dock]")) return
			closeChat()
		}
		window.addEventListener("pointerdown", onPointerDown)
		return () => window.removeEventListener("pointerdown", onPointerDown)
	}, [isOpen])

	return (
		<>
			{isOpen && (
				<ChatWindow
					sessions={sessions}
					active={active}
					pending={pending}
					bottomOffset={bottomOffset}
				/>
			)}
			<button
				data-ai-dock
				type="button"
				onClick={toggleChat}
				aria-label={isOpen ? "Đóng trợ lý" : "Mở trợ lý AI"}
				style={{ bottom: bottomOffset }}
				className={cn(
					"fixed right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:opacity-100 hover:shadow-xl focus-visible:opacity-100",
					isOpen ? "opacity-100" : "opacity-40",
				)}
			>
				{isOpen ? <X className="size-6" /> : <ChatGptIcon className="size-6" />}
			</button>
		</>
	)
}

function ChatWindow({
	sessions,
	active,
	pending,
	bottomOffset,
}: {
	sessions: readonly ChatSession[]
	active: ChatSession | null
	pending: boolean
	bottomOffset: string
}) {
	const [showList, setShowList] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)
	const messages = active?.messages ?? []

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
	}, [])

	return (
		<div
			data-ai-dock
			style={{ bottom: `calc(${bottomOffset} + 4.5rem)` }}
			className="fixed right-6 z-50 flex h-[520px] max-h-[calc(100vh-8rem)] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl"
		>
			<Header
				title={active?.title ?? "Trợ lý học tập"}
				onToggleList={() => setShowList((v) => !v)}
				listOpen={showList}
			/>
			{showList ? (
				<SessionList
					sessions={sessions}
					activeId={active?.id ?? null}
					onSelect={(id) => {
						selectSession(id)
						setShowList(false)
					}}
					onNew={() => {
						createSession()
						setShowList(false)
					}}
					onDelete={deleteSession}
				/>
			) : (
				<>
					<div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
						{messages.length === 0 && <EmptyState />}
						{messages.map((m) => (
							<MessageBubble key={m.id} message={m} />
						))}
						{pending && <TypingIndicator />}
					</div>
					<ChatInput disabled={pending} />
				</>
			)}
		</div>
	)
}

function Header({
	title,
	onToggleList,
	listOpen,
}: {
	title: string
	onToggleList: () => void
	listOpen: boolean
}) {
	return (
		<div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
			<button
				type="button"
				onClick={onToggleList}
				aria-label={listOpen ? "Đóng danh sách" : "Xem danh sách cuộc trò chuyện"}
				className={cn(
					"inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
					listOpen && "bg-muted text-foreground",
				)}
			>
				<PanelLeft className="size-4" />
			</button>
			<div className="flex min-w-0 flex-1 items-center gap-2">
				<ChatGptIcon className="size-4 shrink-0 text-primary" />
				<span className="truncate text-sm font-semibold">{title}</span>
			</div>
			<button
				type="button"
				onClick={() => createSession()}
				aria-label="Cuộc trò chuyện mới"
				className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<MessageSquarePlus className="size-4" />
			</button>
			<button
				type="button"
				onClick={closeChat}
				aria-label="Đóng"
				className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<X className="size-4" />
			</button>
		</div>
	)
}

function SessionList({
	sessions,
	activeId,
	onSelect,
	onNew,
	onDelete,
}: {
	sessions: readonly ChatSession[]
	activeId: string | null
	onSelect: (id: string) => void
	onNew: () => void
	onDelete: (id: string) => void
}) {
	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<button
				type="button"
				onClick={onNew}
				className="mx-3 mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
			>
				<MessageSquarePlus className="size-4" />
				Cuộc trò chuyện mới
			</button>
			<div className="mt-2 flex-1 overflow-y-auto px-2 pb-2">
				{sessions.length === 0 ? (
					<p className="px-3 py-6 text-center text-xs text-muted-foreground">
						Chưa có cuộc trò chuyện nào.
					</p>
				) : (
					<ul className="space-y-0.5">
						{sessions.map((s) => (
							<li key={s.id}>
								<SessionRow
									session={s}
									active={s.id === activeId}
									onSelect={() => onSelect(s.id)}
									onDelete={() => onDelete(s.id)}
								/>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}

function SessionRow({
	session,
	active,
	onSelect,
	onDelete,
}: {
	session: ChatSession
	active: boolean
	onSelect: () => void
	onDelete: () => void
}) {
	return (
		<div
			className={cn(
				"group flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors",
				active ? "bg-muted" : "hover:bg-muted/60",
			)}
		>
			<button
				type="button"
				onClick={onSelect}
				className="min-w-0 flex-1 truncate text-left text-sm"
			>
				{session.title}
			</button>
			<button
				type="button"
				onClick={onDelete}
				aria-label="Xoá cuộc trò chuyện"
				className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-colors hover:bg-background hover:text-destructive group-hover:opacity-100"
			>
				<Trash2 className="size-3.5" />
			</button>
		</div>
	)
}

function EmptyState() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
			<ChatGptIcon className="size-8 text-muted-foreground/60" />
			<p className="text-sm font-medium">Bắt đầu hỏi bất cứ điều gì</p>
			<p className="text-xs text-muted-foreground">
				Hoặc bấm nút <ChatGptIcon className="inline size-3" /> ở câu hỏi để xin giải thích.
			</p>
		</div>
	)
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user"
	return (
		<div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[85%] space-y-2 rounded-2xl px-3 py-2 text-sm",
					isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
				)}
			>
				{message.imageUrl && (
					<img
						src={message.imageUrl}
						alt="Đính kèm"
						className="max-h-48 w-auto rounded-lg object-cover"
					/>
				)}
				{message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
			</div>
		</div>
	)
}

function TypingIndicator() {
	return (
		<div className="flex justify-start">
			<div className="flex gap-1 rounded-2xl bg-muted px-3 py-2.5">
				<Dot delay="0ms" />
				<Dot delay="150ms" />
				<Dot delay="300ms" />
			</div>
		</div>
	)
}

function Dot({ delay }: { delay: string }) {
	return (
		<span
			className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
			style={{ animationDelay: delay }}
		/>
	)
}

function ChatInput({ disabled }: { disabled: boolean }) {
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
		if (!file) return
		if (!file.type.startsWith("image/")) return
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
			for (let i = event.resultIndex; i < event.results.length; i++) {
				transcript += event.results[i]?.[0]?.transcript ?? ""
			}
			setValue((baseTextRef.current ? `${baseTextRef.current} ` : "") + transcript)
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

// Web Speech API minimal types (không có trong lib.dom mặc định).
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
