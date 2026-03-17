interface MockClass {
	id: string
	name: string
	description: string | null
	inviteCode: string
	instructorId: string
	instructorName: string
	memberCount: number
	createdAt: string
	updatedAt: string
}

interface MockMember {
	id: string
	userId: string
	fullName: string
	email: string
	joinedAt: string
}

interface MockAssignment {
	id: string
	classId: string
	title: string
	description: string | null
	type: "exam" | "practice"
	skill: "listening" | "reading" | "writing" | "speaking" | "all"
	dueDate: string | null
	createdAt: string
	totalSubmissions: number
	completedSubmissions: number
}

interface MockAssignmentSubmission {
	id: string
	assignmentId: string
	userId: string
	fullName: string
	score: number | null
	status: "pending" | "submitted" | "graded"
	submittedAt: string | null
}

interface MockLeaderboardEntry {
	rank: number
	userId: string
	fullName: string
	email: string
	avgScore: number
	totalSubmissions: number
	streak: number
}

interface MockMemberProgress {
	userId: string
	fullName: string
	email: string
	skills: Record<
		string,
		{
			currentLevel: string
			trend: "improving" | "stable" | "declining"
			avgScore: number
			attemptCount: number
		}
	>
	lastActiveAt: string
	totalStudyMinutes: number
}

interface MockFeedback {
	id: string
	classId: string
	fromUserId: string
	fromName: string
	toUserId: string
	toName: string
	content: string
	skill: string | null
	createdAt: string
}

// ── Data ──

const INSTRUCTOR_ID = "inst-001"
const INSTRUCTOR_NAME = "Nguyễn Văn Hùng"

const allClasses: MockClass[] = [
	{
		id: "cls-001",
		name: "VSTEP B2 — Khoá 1",
		description: "Lớp luyện thi VSTEP B2 dành cho sinh viên năm 3, học thứ 2-4-6",
		inviteCode: "VSTEP-B2-K1",
		instructorId: INSTRUCTOR_ID,
		instructorName: INSTRUCTOR_NAME,
		memberCount: 6,
		createdAt: "2026-01-15T08:00:00Z",
		updatedAt: "2026-03-10T10:30:00Z",
	},
	{
		id: "cls-002",
		name: "Luyện thi VSTEP C1 — Nhóm A",
		description: "Lớp nâng cao dành cho học viên đã đạt B2, mục tiêu C1",
		inviteCode: "VSTEP-C1-A",
		instructorId: INSTRUCTOR_ID,
		instructorName: INSTRUCTOR_NAME,
		memberCount: 5,
		createdAt: "2026-02-01T08:00:00Z",
		updatedAt: "2026-03-12T14:00:00Z",
	},
	{
		id: "cls-003",
		name: "Writing Workshop — B2",
		description: "Chuyên luyện kỹ năng viết VSTEP B2, 2 buổi/tuần",
		inviteCode: "WRT-B2-WK",
		instructorId: INSTRUCTOR_ID,
		instructorName: INSTRUCTOR_NAME,
		memberCount: 4,
		createdAt: "2026-03-01T08:00:00Z",
		updatedAt: "2026-03-15T09:00:00Z",
	},
]

const allMembers: Record<string, MockMember[]> = {
	"cls-001": [
		{
			id: "m-101",
			userId: "u-101",
			fullName: "Trần Thị Mai",
			email: "mai.tran@email.com",
			joinedAt: "2026-01-16T09:00:00Z",
		},
		{
			id: "m-102",
			userId: "u-102",
			fullName: "Lê Hoàng Nam",
			email: "nam.le@email.com",
			joinedAt: "2026-01-16T10:00:00Z",
		},
		{
			id: "m-103",
			userId: "u-103",
			fullName: "Phạm Minh Tuấn",
			email: "tuan.pham@email.com",
			joinedAt: "2026-01-17T08:00:00Z",
		},
		{
			id: "m-104",
			userId: "u-104",
			fullName: "Nguyễn Thị Hương",
			email: "huong.nguyen@email.com",
			joinedAt: "2026-01-18T09:30:00Z",
		},
		{
			id: "m-105",
			userId: "u-105",
			fullName: "Võ Đức Anh",
			email: "anh.vo@email.com",
			joinedAt: "2026-01-20T11:00:00Z",
		},
		{
			id: "m-106",
			userId: "u-106",
			fullName: "Đặng Quỳnh Như",
			email: "nhu.dang@email.com",
			joinedAt: "2026-01-22T14:00:00Z",
		},
	],
	"cls-002": [
		{
			id: "m-201",
			userId: "u-101",
			fullName: "Trần Thị Mai",
			email: "mai.tran@email.com",
			joinedAt: "2026-02-02T09:00:00Z",
		},
		{
			id: "m-202",
			userId: "u-202",
			fullName: "Bùi Thanh Hải",
			email: "hai.bui@email.com",
			joinedAt: "2026-02-03T10:00:00Z",
		},
		{
			id: "m-203",
			userId: "u-203",
			fullName: "Hoàng Thị Lan",
			email: "lan.hoang@email.com",
			joinedAt: "2026-02-04T08:00:00Z",
		},
		{
			id: "m-204",
			userId: "u-204",
			fullName: "Trịnh Văn Đức",
			email: "duc.trinh@email.com",
			joinedAt: "2026-02-05T09:30:00Z",
		},
		{
			id: "m-205",
			userId: "u-205",
			fullName: "Lý Ngọc Bích",
			email: "bich.ly@email.com",
			joinedAt: "2026-02-06T11:00:00Z",
		},
	],
	"cls-003": [
		{
			id: "m-301",
			userId: "u-102",
			fullName: "Lê Hoàng Nam",
			email: "nam.le@email.com",
			joinedAt: "2026-03-02T09:00:00Z",
		},
		{
			id: "m-302",
			userId: "u-103",
			fullName: "Phạm Minh Tuấn",
			email: "tuan.pham@email.com",
			joinedAt: "2026-03-03T10:00:00Z",
		},
		{
			id: "m-303",
			userId: "u-203",
			fullName: "Hoàng Thị Lan",
			email: "lan.hoang@email.com",
			joinedAt: "2026-03-04T08:00:00Z",
		},
		{
			id: "m-304",
			userId: "u-106",
			fullName: "Đặng Quỳnh Như",
			email: "nhu.dang@email.com",
			joinedAt: "2026-03-05T09:30:00Z",
		},
	],
}

const allAssignments: Record<string, MockAssignment[]> = {
	"cls-001": [
		{
			id: "asg-001",
			classId: "cls-001",
			title: "Listening Practice — Part 1-3",
			description: "Luyện nghe các dạng bài Part 1 đến Part 3, hạn nộp thứ 6",
			type: "practice",
			skill: "listening",
			dueDate: "2026-03-21T23:59:00Z",
			createdAt: "2026-03-14T08:00:00Z",
			totalSubmissions: 6,
			completedSubmissions: 4,
		},
		{
			id: "asg-002",
			classId: "cls-001",
			title: "Đề thi thử VSTEP B2 — Lần 1",
			description: "Thi thử đầy đủ 4 kỹ năng, thời gian 180 phút",
			type: "exam",
			skill: "all",
			dueDate: "2026-03-22T17:00:00Z",
			createdAt: "2026-03-10T08:00:00Z",
			totalSubmissions: 6,
			completedSubmissions: 6,
		},
		{
			id: "asg-003",
			classId: "cls-001",
			title: "Writing Task 2 — Essay",
			description: "Viết essay về chủ đề giáo dục, tối thiểu 250 từ",
			type: "practice",
			skill: "writing",
			dueDate: null,
			createdAt: "2026-03-12T08:00:00Z",
			totalSubmissions: 6,
			completedSubmissions: 3,
		},
		{
			id: "asg-004",
			classId: "cls-001",
			title: "Reading — Passage Analysis",
			description: "Đọc hiểu 2 đoạn văn và trả lời câu hỏi",
			type: "practice",
			skill: "reading",
			dueDate: "2026-03-25T23:59:00Z",
			createdAt: "2026-03-16T08:00:00Z",
			totalSubmissions: 6,
			completedSubmissions: 1,
		},
	],
	"cls-002": [
		{
			id: "asg-101",
			classId: "cls-002",
			title: "Speaking Practice — Part 2 & 3",
			description: "Luyện nói theo chủ đề, ghi âm và nộp",
			type: "practice",
			skill: "speaking",
			dueDate: "2026-03-20T23:59:00Z",
			createdAt: "2026-03-13T08:00:00Z",
			totalSubmissions: 5,
			completedSubmissions: 3,
		},
		{
			id: "asg-102",
			classId: "cls-002",
			title: "Đề thi thử VSTEP C1",
			description: null,
			type: "exam",
			skill: "all",
			dueDate: "2026-03-28T17:00:00Z",
			createdAt: "2026-03-15T08:00:00Z",
			totalSubmissions: 5,
			completedSubmissions: 0,
		},
	],
	"cls-003": [
		{
			id: "asg-201",
			classId: "cls-003",
			title: "Writing Task 1 — Letter",
			description: "Viết thư phản hồi, tối thiểu 120 từ",
			type: "practice",
			skill: "writing",
			dueDate: "2026-03-19T23:59:00Z",
			createdAt: "2026-03-12T08:00:00Z",
			totalSubmissions: 4,
			completedSubmissions: 4,
		},
		{
			id: "asg-202",
			classId: "cls-003",
			title: "Writing Task 2 — Essay",
			description: "Viết essay về ô nhiễm môi trường, 250+ từ",
			type: "practice",
			skill: "writing",
			dueDate: "2026-03-26T23:59:00Z",
			createdAt: "2026-03-16T08:00:00Z",
			totalSubmissions: 4,
			completedSubmissions: 2,
		},
	],
}

const allSubmissions: Record<string, MockAssignmentSubmission[]> = {
	"asg-001": [
		{
			id: "sub-001",
			assignmentId: "asg-001",
			userId: "u-101",
			fullName: "Trần Thị Mai",
			score: 8.5,
			status: "graded",
			submittedAt: "2026-03-18T10:00:00Z",
		},
		{
			id: "sub-002",
			assignmentId: "asg-001",
			userId: "u-102",
			fullName: "Lê Hoàng Nam",
			score: 7.0,
			status: "graded",
			submittedAt: "2026-03-19T08:30:00Z",
		},
		{
			id: "sub-003",
			assignmentId: "asg-001",
			userId: "u-103",
			fullName: "Phạm Minh Tuấn",
			score: null,
			status: "submitted",
			submittedAt: "2026-03-20T14:00:00Z",
		},
		{
			id: "sub-004",
			assignmentId: "asg-001",
			userId: "u-104",
			fullName: "Nguyễn Thị Hương",
			score: 9.0,
			status: "graded",
			submittedAt: "2026-03-17T16:00:00Z",
		},
		{
			id: "sub-005",
			assignmentId: "asg-001",
			userId: "u-105",
			fullName: "Võ Đức Anh",
			score: null,
			status: "pending",
			submittedAt: null,
		},
		{
			id: "sub-006",
			assignmentId: "asg-001",
			userId: "u-106",
			fullName: "Đặng Quỳnh Như",
			score: null,
			status: "pending",
			submittedAt: null,
		},
	],
	"asg-002": [
		{
			id: "sub-011",
			assignmentId: "asg-002",
			userId: "u-101",
			fullName: "Trần Thị Mai",
			score: 8.0,
			status: "graded",
			submittedAt: "2026-03-22T15:00:00Z",
		},
		{
			id: "sub-012",
			assignmentId: "asg-002",
			userId: "u-102",
			fullName: "Lê Hoàng Nam",
			score: 6.5,
			status: "graded",
			submittedAt: "2026-03-22T15:10:00Z",
		},
		{
			id: "sub-013",
			assignmentId: "asg-002",
			userId: "u-103",
			fullName: "Phạm Minh Tuấn",
			score: 7.5,
			status: "graded",
			submittedAt: "2026-03-22T15:30:00Z",
		},
		{
			id: "sub-014",
			assignmentId: "asg-002",
			userId: "u-104",
			fullName: "Nguyễn Thị Hương",
			score: 9.5,
			status: "graded",
			submittedAt: "2026-03-22T14:50:00Z",
		},
		{
			id: "sub-015",
			assignmentId: "asg-002",
			userId: "u-105",
			fullName: "Võ Đức Anh",
			score: 5.5,
			status: "graded",
			submittedAt: "2026-03-22T16:00:00Z",
		},
		{
			id: "sub-016",
			assignmentId: "asg-002",
			userId: "u-106",
			fullName: "Đặng Quỳnh Như",
			score: 7.0,
			status: "graded",
			submittedAt: "2026-03-22T15:45:00Z",
		},
	],
}

const allFeedback: Record<string, MockFeedback[]> = {
	"cls-001": [
		{
			id: "fb-001",
			classId: "cls-001",
			fromUserId: INSTRUCTOR_ID,
			fromName: INSTRUCTOR_NAME,
			toUserId: "u-101",
			toName: "Trần Thị Mai",
			content: "Kỹ năng nghe tiến bộ rõ rệt. Cần chú ý thêm phần nghe Part 3 về suy luận.",
			skill: "listening",
			createdAt: "2026-03-15T08:00:00Z",
		},
		{
			id: "fb-002",
			classId: "cls-001",
			fromUserId: INSTRUCTOR_ID,
			fromName: INSTRUCTOR_NAME,
			toUserId: "u-105",
			toName: "Võ Đức Anh",
			content: "Cần nộp bài đúng hạn. Bài viết cần cải thiện cấu trúc đoạn văn và liên kết ý.",
			skill: "writing",
			createdAt: "2026-03-16T10:00:00Z",
		},
		{
			id: "fb-003",
			classId: "cls-001",
			fromUserId: INSTRUCTOR_ID,
			fromName: INSTRUCTOR_NAME,
			toUserId: "u-102",
			toName: "Lê Hoàng Nam",
			content:
				"Phát âm tốt nhưng cần mở rộng vốn từ về các chủ đề xã hội. Luyện thêm speaking Part 3.",
			skill: "speaking",
			createdAt: "2026-03-14T14:00:00Z",
		},
		{
			id: "fb-004",
			classId: "cls-001",
			fromUserId: INSTRUCTOR_ID,
			fromName: INSTRUCTOR_NAME,
			toUserId: "u-104",
			toName: "Nguyễn Thị Hương",
			content: "Xuất sắc! Tiếp tục giữ phong độ. Có thể thử sức với đề C1.",
			skill: null,
			createdAt: "2026-03-17T09:00:00Z",
		},
		{
			id: "fb-005",
			classId: "cls-001",
			fromUserId: INSTRUCTOR_ID,
			fromName: INSTRUCTOR_NAME,
			toUserId: "u-103",
			toName: "Phạm Minh Tuấn",
			content: "Kỹ năng đọc ổn định. Cần rèn thêm kỹ năng viết — chú ý grammar cho câu phức.",
			skill: "reading",
			createdAt: "2026-03-18T08:00:00Z",
		},
	],
	"cls-002": [
		{
			id: "fb-101",
			classId: "cls-002",
			fromUserId: INSTRUCTOR_ID,
			fromName: INSTRUCTOR_NAME,
			toUserId: "u-202",
			toName: "Bùi Thanh Hải",
			content: "Cần cải thiện tốc độ đọc. Kỹ năng nghe đã tốt ở mức C1.",
			skill: "reading",
			createdAt: "2026-03-16T10:00:00Z",
		},
	],
	"cls-003": [
		{
			id: "fb-201",
			classId: "cls-003",
			fromUserId: INSTRUCTOR_ID,
			fromName: INSTRUCTOR_NAME,
			toUserId: "u-102",
			toName: "Lê Hoàng Nam",
			content: "Bài viết Task 1 đạt yêu cầu. Chú ý format thư và tone phù hợp.",
			skill: "writing",
			createdAt: "2026-03-17T08:00:00Z",
		},
	],
}

function buildLeaderboard(classId: string): MockLeaderboardEntry[] {
	const members = allMembers[classId] ?? []
	const assignments = allAssignments[classId] ?? []
	const entries: MockLeaderboardEntry[] = members.map((m) => {
		const scores: number[] = []
		let submissionCount = 0
		for (const asg of assignments) {
			const subs = allSubmissions[asg.id] ?? []
			const sub = subs.find((s) => s.userId === m.userId)
			if (sub?.score != null) {
				scores.push(sub.score)
				submissionCount++
			}
		}
		const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
		return {
			rank: 0,
			userId: m.userId,
			fullName: m.fullName,
			email: m.email,
			avgScore: Math.round(avg * 10) / 10,
			totalSubmissions: submissionCount,
			streak: Math.floor(Math.random() * 10) + 1,
		}
	})
	entries.sort((a, b) => b.avgScore - a.avgScore)
	return entries.map((e, i) => ({ ...e, rank: i + 1 }))
}

function buildMemberProgress(classId: string): MockMemberProgress[] {
	const members = allMembers[classId] ?? []
	const trends: Array<"improving" | "stable" | "declining"> = ["improving", "stable", "declining"]
	const levels = ["A2", "B1", "B2", "C1"]
	return members.map((m, i) => ({
		userId: m.userId,
		fullName: m.fullName,
		email: m.email,
		skills: {
			listening: {
				currentLevel: levels[(i + 1) % levels.length],
				trend: trends[i % trends.length],
				avgScore: 5.5 + ((i * 7) % 40) / 10,
				attemptCount: 5 + ((i * 3) % 12),
			},
			reading: {
				currentLevel: levels[(i + 2) % levels.length],
				trend: trends[(i + 1) % trends.length],
				avgScore: 6.0 + ((i * 5) % 35) / 10,
				attemptCount: 4 + ((i * 2) % 10),
			},
			writing: {
				currentLevel: levels[i % levels.length],
				trend: trends[(i + 2) % trends.length],
				avgScore: 5.0 + ((i * 9) % 45) / 10,
				attemptCount: 3 + ((i * 4) % 8),
			},
			speaking: {
				currentLevel: levels[(i + 3) % levels.length],
				trend: trends[i % trends.length],
				avgScore: 5.5 + ((i * 6) % 38) / 10,
				attemptCount: 2 + ((i * 3) % 7),
			},
		},
		lastActiveAt: `2026-03-${String(10 + (i % 7)).padStart(2, "0")}T${String(8 + i).padStart(2, "0")}:00:00Z`,
		totalStudyMinutes: 120 + i * 45,
	}))
}

// ── Instructor types (matching use-classes.ts) ──

interface MockInstructorClass {
	id: string
	name: string
	description: string | null
	inviteCode: string
	instructorId: string
	createdAt: string
	updatedAt: string
}

interface MockInstructorClassMember {
	id: string
	userId: string
	fullName: string | null
	email: string
	joinedAt: string
}

interface MockInstructorClassDetail extends Omit<MockInstructorClass, "inviteCode"> {
	inviteCode: string | null
	members: MockInstructorClassMember[]
	memberCount: number
}

interface MockInstructorDashboard {
	memberCount: number
	atRiskCount: number
	atRiskLearners: {
		userId: string
		fullName: string | null
		email: string
		reasons: string[]
	}[]
	skillSummary: Record<
		string,
		{
			avgScore: number | null
			trendDistribution: { improving: number; stable: number; declining: number }
		}
	>
}

interface MockInstructorFeedback {
	id: string
	classId: string
	fromUserId: string
	toUserId: string
	content: string
	skill: string | null
	submissionId: string | null
	createdAt: string
	updatedAt: string
}

// ── Public API ──

function getMockInstructorClasses(): MockInstructorClass[] {
	return allClasses.map((c) => ({
		id: c.id,
		name: c.name,
		description: c.description,
		inviteCode: c.inviteCode,
		instructorId: c.instructorId,
		createdAt: c.createdAt,
		updatedAt: c.updatedAt,
	}))
}

function getMockInstructorClassDetail(classId: string): MockInstructorClassDetail | null {
	const cls = allClasses.find((c) => c.id === classId)
	if (!cls) return null
	const members: MockInstructorClassMember[] = (allMembers[classId] ?? []).map((m) => ({
		id: m.id,
		userId: m.userId,
		fullName: m.fullName,
		email: m.email,
		joinedAt: m.joinedAt,
	}))
	return {
		id: cls.id,
		name: cls.name,
		description: cls.description,
		inviteCode: cls.inviteCode,
		instructorId: cls.instructorId,
		createdAt: cls.createdAt,
		updatedAt: cls.updatedAt,
		members,
		memberCount: members.length,
	}
}

function getMockInstructorDashboard(classId: string): MockInstructorDashboard {
	const members = allMembers[classId] ?? []
	const progress = buildMemberProgress(classId)

	const atRiskLearners: MockInstructorDashboard["atRiskLearners"] = []
	for (const mp of progress) {
		const reasons: string[] = []
		for (const [skill, data] of Object.entries(mp.skills)) {
			if (data.trend === "declining") reasons.push(`${skill}: xu hướng giảm`)
			if (data.avgScore < 5.5) reasons.push(`${skill}: điểm TB thấp (${data.avgScore.toFixed(1)})`)
		}
		if (reasons.length > 0) {
			const member = members.find((m) => m.userId === mp.userId)
			atRiskLearners.push({
				userId: mp.userId,
				fullName: member?.fullName ?? null,
				email: mp.email,
				reasons,
			})
		}
	}

	const skillSummary: MockInstructorDashboard["skillSummary"] = {}
	const skills = ["listening", "reading", "writing", "speaking"]
	for (const skill of skills) {
		const scores: number[] = []
		let improving = 0
		let stable = 0
		let declining = 0
		for (const mp of progress) {
			const s = mp.skills[skill]
			if (!s) continue
			scores.push(s.avgScore)
			if (s.trend === "improving") improving++
			else if (s.trend === "stable") stable++
			else declining++
		}
		skillSummary[skill] = {
			avgScore:
				scores.length > 0
					? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
					: null,
			trendDistribution: { improving, stable, declining },
		}
	}

	return {
		memberCount: members.length,
		atRiskCount: atRiskLearners.length,
		atRiskLearners,
		skillSummary,
	}
}

function getMockInstructorFeedback(classId: string): MockInstructorFeedback[] {
	return (allFeedback[classId] ?? []).map((fb) => ({
		id: fb.id,
		classId: fb.classId,
		fromUserId: fb.fromUserId,
		toUserId: fb.toUserId,
		content: fb.content,
		skill: fb.skill,
		submissionId: null,
		createdAt: fb.createdAt,
		updatedAt: fb.createdAt,
	}))
}

function getMockClasses(role: "instructor" | "learner"): MockClass[] {
	if (role === "instructor") return allClasses
	return allClasses.slice(0, 2)
}

function getMockClassDetail(classId: string): { class: MockClass; members: MockMember[] } | null {
	const cls = allClasses.find((c) => c.id === classId)
	if (!cls) return null
	return { class: cls, members: allMembers[classId] ?? [] }
}

function getMockAssignments(classId: string): MockAssignment[] {
	return allAssignments[classId] ?? []
}

function getMockAssignmentSubmissions(assignmentId: string): MockAssignmentSubmission[] {
	return allSubmissions[assignmentId] ?? []
}

function getMockLeaderboard(classId: string): MockLeaderboardEntry[] {
	return buildLeaderboard(classId)
}

function getMockMemberProgress(classId: string): MockMemberProgress[] {
	return buildMemberProgress(classId)
}

function getMockFeedback(classId: string): MockFeedback[] {
	return allFeedback[classId] ?? []
}

function getMockLearnerFeedback(classId: string, userId: string): MockFeedback[] {
	const fb = allFeedback[classId] ?? []
	return fb.filter((f) => f.toUserId === userId)
}

export {
	getMockAssignmentSubmissions,
	getMockAssignments,
	getMockClassDetail,
	getMockClasses,
	getMockFeedback,
	getMockInstructorClasses,
	getMockInstructorClassDetail,
	getMockInstructorDashboard,
	getMockInstructorFeedback,
	getMockLeaderboard,
	getMockLearnerFeedback,
	getMockMemberProgress,
}

export type {
	MockAssignment,
	MockAssignmentSubmission,
	MockClass,
	MockFeedback,
	MockInstructorClass,
	MockInstructorClassDetail,
	MockInstructorDashboard,
	MockInstructorFeedback,
	MockLeaderboardEntry,
	MockMember,
	MockMemberProgress,
}
