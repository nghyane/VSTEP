import { create } from "zustand"

interface Toast {
	id: number
	message: string
	type: "error" | "success"
}

interface ToastStore {
	toasts: Toast[]
	add: (message: string, type?: Toast["type"]) => void
	remove: (id: number) => void
}

let nextId = 0

export const useToast = create<ToastStore>()((set) => ({
	toasts: [],
	add(message, type = "error") {
		const id = nextId++
		set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
		setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
	},
	remove(id) {
		set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
	},
}))
