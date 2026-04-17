// TextSelectionPopup — hiện nút "Hỏi AI" nhỏ khi user tô đen text.

import { MessageCircle } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { createSession, sendMessage } from "#/lib/ai-chat/store"

interface PopupState {
	text: string
	x: number
	y: number
}

export function TextSelectionPopup({ children, promptTemplate }: { children: React.ReactNode; promptTemplate?: (text: string) => string }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [popup, setPopup] = useState<PopupState | null>(null)

	const handleMouseUp = useCallback(() => {
		requestAnimationFrame(() => {
			const sel = window.getSelection()
			const text = sel?.toString().trim()
			if (!text || !sel || sel.rangeCount === 0) {
				setPopup(null)
				return
			}
			const range = sel.getRangeAt(0)
			if (!containerRef.current?.contains(range.commonAncestorContainer)) {
				setPopup(null)
				return
			}
			const rect = range.getBoundingClientRect()
			setPopup({ text, x: rect.left + rect.width / 2, y: rect.top })
		})
	}, [])

	useEffect(() => {
		if (!popup) return
		function handleSelectionChange() {
			const sel = window.getSelection()
			if (!sel?.toString().trim()) setPopup(null)
		}
		document.addEventListener("selectionchange", handleSelectionChange)
		return () => document.removeEventListener("selectionchange", handleSelectionChange)
	}, [popup])

	return (
		<div ref={containerRef} onMouseUp={handleMouseUp} onTouchEnd={handleMouseUp}>
			{children}
			{popup && createPortal(
				<AskAiButton text={popup.text} x={popup.x} y={popup.y} onClose={() => setPopup(null)} promptTemplate={promptTemplate} />,
				document.body,
			)}
		</div>
	)
}

function AskAiButton({ text, x, y, onClose, promptTemplate }: { text: string; x: number; y: number; onClose: () => void; promptTemplate?: (text: string) => string }) {
	const ref = useRef<HTMLButtonElement>(null)
	const [pos, setPos] = useState({ left: x, top: y })

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		let left = x - rect.width / 2
		const top = y - rect.height - 6
		if (left < 8) left = 8
		if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8
		setPos({ left, top: top < 8 ? y + 24 : top })
	}, [x, y])

	function handleClick() {
		createSession()
		const prompt = promptTemplate
			? promptTemplate(text)
			: `Giải thích nghĩa của "${text}" trong ngữ cảnh bài đọc tiếng Anh. Dịch sang tiếng Việt và cho ví dụ.`
		void sendMessage(prompt)
		onClose()
	}

	return (
		<button
			ref={ref}
			type="button"
			onClick={handleClick}
			className="fixed z-50 inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium shadow-lg transition-colors hover:bg-muted"
			style={{ left: pos.left, top: pos.top }}
		>
			<MessageCircle className="size-3.5 text-primary" />
			Hỏi AI
		</button>
	)
}
