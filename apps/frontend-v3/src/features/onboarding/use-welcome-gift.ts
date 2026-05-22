import { create } from "zustand"

export type GiftKind = "welcome" | "streak-chest"

interface WelcomeGiftState {
	amount: number | null
	kind: GiftKind
	streakDays: number | null
	show: (amount: number, kind?: GiftKind, streakDays?: number | null) => void
	dismiss: () => void
}

export const useWelcomeGift = create<WelcomeGiftState>()((set) => ({
	amount: null,
	kind: "welcome",
	streakDays: null,
	show: (amount, kind = "welcome", streakDays = null) => set({ amount, kind, streakDays }),
	dismiss: () => set({ amount: null }),
}))
