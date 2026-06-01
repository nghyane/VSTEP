// useMockGoal — trả về EnrichedGoal giả từ localStorage (onboarding data)
// Khi API sẵn sàng: thay bằng query thật từ backend

import { useMemo } from "react"
import type { OnboardingData } from "./types"

const STORAGE_KEY = "vstep_onboarding_data"

export interface MockGoal {
	deadline: string // ISO date
	daysRemaining: number | null
	totalDays: number
	progressDays: number
}

export function saveOnboardingData(data: OnboardingData): void {
	if (typeof window === "undefined") return
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadOnboardingData(): OnboardingData | null {
	if (typeof window === "undefined") return null
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		return JSON.parse(raw) as OnboardingData
	} catch {
		return null
	}
}

function computeDeadline(examDate: Date | string | null): string {
	// examDate có thể là Date (object) hoặc string (sau JSON.parse)
	if (examDate) {
		const d = examDate instanceof Date ? examDate : new Date(examDate as string)
		return d.toISOString()
	}
	// Mặc định +6 tháng
	const d = new Date()
	d.setMonth(d.getMonth() + 6)
	return d.toISOString()
}

export function useMockGoal(): MockGoal | null {
	return useMemo(() => {
		const data = loadOnboardingData()
		if (!data) return null
		const deadline = new Date(computeDeadline(data.examDate))
		const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000)
		const totalDays = 180 // 6 tháng
		const progressDays = Math.max(0, totalDays - daysRemaining)
		return {
			deadline: deadline.toISOString(),
			daysRemaining: Math.max(0, daysRemaining),
			totalDays,
			progressDays,
		}
	}, [])
}
