import { useState } from "react"
import { createPortal } from "react-dom"

const ZALO_URL = "https://zalo.me/0343062376"

export function SupportFab() {
	const [open, setOpen] = useState(false)

	return createPortal(
		<div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
			{open && (
				<a
					href={ZALO_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-2.5 rounded-full bg-[#0068FF] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 animate-[slideIn_0.15s_ease-out]"
				>
					<img src="/icons/zalo.png" alt="" className="size-5 shrink-0" />
					Chat Zalo hỗ trợ
				</a>
			)}
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-label="Hỗ trợ"
				className="flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
			>
				{open ? <CloseIcon /> : <ChatIcon />}
			</button>
		</div>,
		document.body,
	)
}

function ChatIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			className="size-6"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
			/>
		</svg>
	)
}

function CloseIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			className="size-6"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			aria-hidden="true"
		>
			<path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
		</svg>
	)
}
