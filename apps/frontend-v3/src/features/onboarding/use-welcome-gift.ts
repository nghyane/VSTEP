import { create } from "zustand"

interface WelcomeGiftState {
	amount: number | null
	show: (amount: number) => void
	dismiss: () => void
}

export const useWelcomeGift = create<WelcomeGiftState>()((set) => ({
	amount: null,
	show: (amount) => set({ amount }),
	dismiss: () => set({ amount: null }),
}))
