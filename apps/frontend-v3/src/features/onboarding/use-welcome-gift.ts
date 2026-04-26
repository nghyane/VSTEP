import { create } from "zustand"

export type GiftKind = "welcome" | "streak-30"

interface WelcomeGiftState {
	amount: number | null
	kind: GiftKind
	show: (amount: number, kind?: GiftKind) => void
	dismiss: () => void
}

export const useWelcomeGift = create<WelcomeGiftState>()((set) => ({
	amount: null,
	kind: "welcome",
	show: (amount, kind = "welcome") => set({ amount, kind }),
	dismiss: () => set({ amount: null }),
}))
