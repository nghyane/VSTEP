// Auth
interface AuthUser {
	id: string
	email: string
	fullName: string | null
	role: "learner" | "instructor" | "admin"
}

interface LoginResponse {
	user: AuthUser
	accessToken: string
	refreshToken: string
	expiresIn: number
}

interface RegisterResponse {
	user: AuthUser
	message: string
}

// Pagination
interface PaginationMeta {
	page: number
	limit: number
	total: number
	totalPages: number
}

interface PaginatedResponse<T> {
	data: T[]
	meta: PaginationMeta
}

// Exams
type Skill = "listening" | "reading" | "writing" | "speaking"
type QuestionLevel = "A2" | "B1" | "B2" | "C1"
type VstepBand = "A1" | "A2" | "B1" | "B2" | "C1"

interface ExamBlueprint {
	listening?: { questionIds: string[] }
	reading?: { questionIds: string[] }
	writing?: { questionIds: string[] }
	speaking?: { questionIds: string[] }
	durationMinutes: number
}

interface Exam {
	id: string
	title: string
	level: QuestionLevel
	blueprint: ExamBlueprint
	isActive: boolean
	createdBy: string | null
	createdAt: string
	updatedAt: string
	description: string | null
}

interface ExamSession {
	id: string
	userId: string
	examId: string
	status: "in_progress" | "submitted" | "completed" | "abandoned"
	listeningScore: number | null
	readingScore: number | null
	writingScore: number | null
	speakingScore: number | null
	overallScore: number | null
	startedAt: string
	completedAt: string | null
	createdAt: string
	updatedAt: string
}

// Progress
type StreakDirection = "up" | "down" | "neutral"

interface SkillProgress {
	id: string
	userId: string
	skill: Skill
	currentLevel: VstepBand | null
	targetLevel: VstepBand | null
	scaffoldLevel: number
	streakCount: number
	streakDirection: StreakDirection
	attemptCount: number
	createdAt: string
	updatedAt: string
}

interface Goal {
	id: string
	userId: string
	targetBand: VstepBand
	currentEstimatedBand: VstepBand | null
	deadline: string
	dailyStudyTimeMinutes: number | null
	createdAt: string
	updatedAt: string
}

interface ProgressOverview {
	skills: SkillProgress[]
	goal: Goal | null
}

type Trend = "improving" | "stable" | "declining" | "inconsistent" | "insufficient_data"

interface SpiderChartSkill {
	current: number
	trend: Trend
}

interface SpiderChartResponse {
	skills: Record<Skill, SpiderChartSkill>
	goal: Goal | null
	eta: {
		weeks: number | null
		perSkill: Record<Skill, number | null>
	}
}

// Question content types (for exam taking)
interface MCQItem {
	stem: string
	options: string[]
}

interface ListeningContent {
	audioUrl: string
	transcript?: string
	items: MCQItem[]
}

interface ReadingContent {
	passage: string
	title?: string
	items: MCQItem[]
}

interface ReadingTNGContent {
	passage: string
	title?: string
	items: { stem: string; options: string[] }[]
}

interface ReadingGapFillContent {
	title?: string
	textWithGaps: string
	items: { options: string[] }[]
}

interface ReadingMatchingContent {
	title?: string
	paragraphs: { label: string; text: string }[]
	headings: string[]
}

interface WritingContent {
	prompt: string
	taskType: "letter" | "essay"
	instructions?: string[]
	minWords: number
	requiredPoints?: string[]
}

interface SpeakingPart1Content {
	topics: { name: string; questions: string[] }[]
}

interface SpeakingPart2Content {
	situation: string
	options: string[]
	preparationSeconds: number
	speakingSeconds: number
}

interface SpeakingPart3Content {
	centralIdea: string
	suggestions: string[]
	followUpQuestion: string
	preparationSeconds: number
	speakingSeconds: number
}

type QuestionContent =
	| ListeningContent
	| ReadingContent
	| ReadingTNGContent
	| ReadingGapFillContent
	| ReadingMatchingContent
	| WritingContent
	| SpeakingPart1Content
	| SpeakingPart2Content
	| SpeakingPart3Content

interface Question {
	id: string
	skill: Skill
	part: number
	content: QuestionContent
	answerKey?: { correctAnswers: Record<string, string> } | null
	explanation?: string | null
	isActive: boolean
	createdBy: string | null
	createdAt: string
	updatedAt: string
}

// Answer types
interface ObjectiveAnswer {
	answers: Record<string, string>
}

interface WritingAnswer {
	text: string
}

interface SpeakingAnswer {
	audioUrl: string
	durationSeconds: number
	transcript?: string
}

type SubmissionAnswer = ObjectiveAnswer | WritingAnswer | SpeakingAnswer

// Exam answer (saved in session)
interface ExamAnswer {
	id: string
	sessionId: string
	questionId: string
	answer: SubmissionAnswer
	isCorrect: boolean | null
	createdAt: string
	updatedAt: string
}

// Progress skill detail
interface ProgressRecentScore {
	score: number
	createdAt: string
}

interface ProgressSkillDetail {
	progress: SkillProgress | null
	recentScores: ProgressRecentScore[]
	windowAvg: number | null
	windowDeviation: number | null
	trend: Trend
	eta: number | null
}

// User (from /users/:id - without password)
interface User {
	id: string
	email: string
	fullName: string | null
	role: "learner" | "instructor" | "admin"
	avatarKey: string | null
	createdAt: string
	updatedAt: string
}

// Submissions
type SubmissionStatus = "pending" | "processing" | "completed" | "review_pending" | "failed"
type GradingMode = "auto" | "human" | "hybrid"

interface Submission {
	id: string
	userId: string
	questionId: string
	skill: Skill
	status: SubmissionStatus
	score: number | null
	band: VstepBand | null
	createdAt: string
	updatedAt: string
	completedAt: string | null
}

interface SubmissionFull extends Submission {
	answer: SubmissionAnswer | null
	result: Record<string, unknown> | null
	feedback: string | null
}

// Knowledge Points
type KnowledgePointCategory =
	| "grammar"
	| "vocabulary"
	| "pronunciation"
	| "discourse"
	| "pragmatics"
	| "fluency"

interface KnowledgePoint {
	id: string
	category: KnowledgePointCategory
	name: string
	createdAt: string
	updatedAt: string
}

// Question with knowledge points (admin view)
interface QuestionWithKnowledgePoints extends Question {
	knowledgePointIds: string[]
}

export type {
	AuthUser,
	Exam,
	KnowledgePoint,
	KnowledgePointCategory,
	ExamAnswer,
	ExamBlueprint,
	ExamSession,
	Goal,
	GradingMode,
	ListeningContent,
	LoginResponse,
	MCQItem,
	ObjectiveAnswer,
	PaginatedResponse,
	PaginationMeta,
	ProgressOverview,
	ProgressRecentScore,
	ProgressSkillDetail,
	Question,
	QuestionContent,
	QuestionLevel,
	QuestionWithKnowledgePoints,
	ReadingContent,
	ReadingGapFillContent,
	ReadingMatchingContent,
	ReadingTNGContent,
	RegisterResponse,
	Skill,
	SkillProgress,
	SpeakingAnswer,
	SpeakingPart1Content,
	SpeakingPart2Content,
	SpeakingPart3Content,
	SpiderChartResponse,
	SpiderChartSkill,
	StreakDirection,
	Submission,
	SubmissionAnswer,
	SubmissionFull,
	SubmissionStatus,
	Trend,
	User,
	VstepBand,
	WritingAnswer,
	WritingContent,
}
