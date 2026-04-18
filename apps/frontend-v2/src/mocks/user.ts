export interface MockUser {
	id: string
	fullName: string
	email: string
	initials: string
	unreadNotifications: number
	entryLevel: string
	predictedLevel: string
	targetLevel: string
	examDate: string
	daysUntilExam: number
}

export const MOCK_USER: MockUser = {
	id: "mock-user-1",
	fullName: "Nguyễn Phát",
	email: "nguyen.phat@vstep.vn",
	initials: "NP",
	unreadNotifications: 2,
	entryLevel: "A1",
	predictedLevel: "A1",
	targetLevel: "C1",
	examDate: "28/04/2026",
	daysUntilExam: 16,
}
