import { create } from "zustand"

interface CoinGainStore {
	pulse: number
	amount: number
	trigger: (amount: number) => void
}

export const useCoinGain = create<CoinGainStore>()((set) => ({
	pulse: 0,
	amount: 0,
	trigger(amount) {
		set((s) => ({ pulse: s.pulse + 1, amount }))
	},
}))
