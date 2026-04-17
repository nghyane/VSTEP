// Global AI chat store với multi-session + localStorage persist.
// Pattern: module-level state + CustomEvent broadcast cho useSyncExternalStore.

export interface ChatMessage {
	readonly id: string
	readonly role: "user" | "assistant"
	readonly content: string
	readonly imageUrl?: string
}

export interface ChatSession {
	readonly id: string
	readonly title: string
	readonly messages: readonly ChatMessage[]
	readonly createdAt: number
}

interface ChatState {
	readonly isOpen: boolean
	readonly sessions: readonly ChatSession[]
	readonly activeId: string | null
	readonly pending: boolean
	readonly bottomOffset: string
}

const EVENT = "vstep:ai-chat-change"
const STORAGE_KEY = "vstep:ai-chat:v1"

let state: ChatState = loadInitial()

function loadInitial(): ChatState {
	const base: ChatState = {
		isOpen: false,
		sessions: [],
		activeId: null,
		pending: false,
		bottomOffset: "1.5rem",
	}
	if (typeof window === "undefined") return base
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return base
		const parsed = JSON.parse(raw) as {
			sessions?: ChatSession[]
			activeId?: string | null
		}
		return {
			...base,
			sessions: parsed.sessions ?? [],
			activeId: parsed.activeId ?? null,
		}
	} catch {
		return base
	}
}

function persist() {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ sessions: state.sessions, activeId: state.activeId }),
		)
	} catch {
		// quota/private mode — ignore
	}
}

function emit() {
	persist()
	window.dispatchEvent(new CustomEvent(EVENT))
}

export function getChatState(): ChatState {
	return state
}

export function subscribeChat(callback: () => void): () => void {
	window.addEventListener(EVENT, callback)
	return () => window.removeEventListener(EVENT, callback)
}

export function getActiveSession(): ChatSession | null {
	return state.sessions.find((s) => s.id === state.activeId) ?? null
}

// ─── UI actions ────────────────────────────────────────────────────

export function openChat() {
	state = { ...state, isOpen: true }
	emit()
}

export function closeChat() {
	state = { ...state, isOpen: false }
	emit()
}

export function toggleChat() {
	state = { ...state, isOpen: !state.isOpen }
	emit()
}

export function setChatBottomOffset(offset: string) {
	if (state.bottomOffset === offset) return
	state = { ...state, bottomOffset: offset }
	// không persist offset — không cần emit qua storage
	window.dispatchEvent(new CustomEvent(EVENT))
}

// ─── Session actions ───────────────────────────────────────────────

export function createSession(): string {
	const id = crypto.randomUUID()
	const session: ChatSession = {
		id,
		title: "Cuộc trò chuyện mới",
		messages: [],
		createdAt: Date.now(),
	}
	state = { ...state, sessions: [session, ...state.sessions], activeId: id }
	emit()
	return id
}

export function selectSession(id: string) {
	if (state.activeId === id) return
	state = { ...state, activeId: id }
	emit()
}

export function deleteSession(id: string) {
	const sessions = state.sessions.filter((s) => s.id !== id)
	const activeId = state.activeId === id ? (sessions[0]?.id ?? null) : state.activeId
	state = { ...state, sessions, activeId }
	emit()
}

export function renameSession(id: string, title: string) {
	state = {
		...state,
		sessions: state.sessions.map((s) => (s.id === id ? { ...s, title } : s)),
	}
	emit()
}

// ─── Messaging ─────────────────────────────────────────────────────
// TODO(backend): Thay mockAiReply() bằng POST /api/v1/ai/chat
// Request:  { session_id, message, image_url? }
// Response: { content: string } (streaming SSE hoặc JSON đơn)
// Image:    upload lên R2 trước (presigned URL) → gửi image_url thay base64
// Auth:     Bearer token (đã có middleware)

function ensureActiveSession(): string {
	if (state.activeId) return state.activeId
	return createSession()
}

function updateSession(id: string, patch: (s: ChatSession) => ChatSession) {
	state = {
		...state,
		sessions: state.sessions.map((s) => (s.id === id ? patch(s) : s)),
	}
}

export async function sendMessage(content: string, imageUrl?: string) {
	const text = content.trim()
	if ((!text && !imageUrl) || state.pending) return
	const sessionId = ensureActiveSession()
	const userMsg: ChatMessage = {
		id: crypto.randomUUID(),
		role: "user",
		content: text,
		...(imageUrl ? { imageUrl } : {}),
	}

	updateSession(sessionId, (s) => ({
		...s,
		title: s.messages.length === 0 ? makeTitle(text || "Ảnh đính kèm") : s.title,
		messages: [...s.messages, userMsg],
	}))
	state = { ...state, pending: true, isOpen: true }
	emit()

	const reply = await mockAiReply(text, imageUrl)
	const botMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: reply }
	updateSession(sessionId, (s) => ({ ...s, messages: [...s.messages, botMsg] }))
	state = { ...state, pending: false }
	emit()
}

function makeTitle(text: string): string {
	const clean = text.replace(/\s+/g, " ").trim()
	return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean
}

export interface ExplainContext {
	readonly question: string
	readonly options: readonly string[]
	readonly correctIndex: number
	readonly userIndex: number | null
	readonly submitted: boolean
}

export function askExplainQuestion(ctx: ExplainContext) {
	createSession()
	const letter = (i: number) => String.fromCharCode(65 + i)
	const user = ctx.userIndex === null ? "chưa chọn" : letter(ctx.userIndex)
	const prompt =
		`Giải thích câu hỏi sau giúp mình:\n\n"${ctx.question}"\n\n` +
		ctx.options.map((o, i) => `${letter(i)}. ${o}`).join("\n") +
		`\n\nĐáp án đúng: ${letter(ctx.correctIndex)}. ` +
		(ctx.submitted ? `Mình chọn: ${user}. Vì sao đáp án đúng là ${letter(ctx.correctIndex)}?` : "")
	void sendMessage(prompt)
}

async function mockAiReply(userContent: string, imageUrl?: string): Promise<string> {
	await new Promise((r) => setTimeout(r, 700))
	if (imageUrl) {
		return "Mình đã nhận được ảnh bạn gửi. (Response mock — sẽ phân tích ảnh khi backend AI sẵn sàng.)"
	}
	if (userContent.includes("Đáp án đúng")) {
		return "Đây là giải thích mẫu. Đáp án đúng được chọn vì nó khớp trực tiếp với thông tin trong đoạn/câu hỏi, trong khi các lựa chọn còn lại hoặc lệch nghĩa, hoặc không được nhắc đến. (Response mock — sẽ thay bằng AI thật khi backend sẵn sàng.)"
	}
	return "Mình đã nhận được câu hỏi. Đây là phản hồi mẫu trong lúc backend AI chưa kết nối."
}
