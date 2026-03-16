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

type ExamType = "practice" | "placement" | "mock"

// Exams
type Skill = "listening" | "reading" | "writing" | "speaking"
type QuestionLevel = "A2" | "B1" | "B2" | "C1"
type VstepBand = "B1" | "B2" | "C1"

interface ExamBlueprint {
	listening?: { questionIds: string[] }
	reading?: { questionIds: string[] }
	writing?: { questionIds: string[] }
	speaking?: { questionIds: string[] }
	durationMinutes?: number
}

interface Exam {
	id: string
	title: string
	level: QuestionLevel
	type: ExamType
	durationMinutes: number | null
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
	overallBand: VstepBand | null
	startedAt: string
	completedAt: string | null
	createdAt: string
	updatedAt: string
}

interface SessionExamEmbed {
	title: string
	level: QuestionLevel
	type: ExamType
}

interface ExamSessionWithExam extends ExamSession {
	exam: SessionExamEmbed | null
}

// Session detail (from GET /api/exams/sessions/:id — includes questions + answers)
interface SessionQuestion {
	id: string
	skill: Skill
	part: number
	content: QuestionContent
}

interface SessionAnswer {
	questionId: string
	answer: SubmissionAnswer
}

interface ExamSessionDetail extends ExamSession {
	questions: SessionQuestion[]
	answers: SessionAnswer[]
}

// Progress
type StreakDirection = "up" | "down" | "neutral"

interface SkillProgress {
	id: string
	userId: string
	skill: Skill
	currentLevel: QuestionLevel
	targetLevel: QuestionLevel | null
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

interface EnrichedGoal extends Goal {
	achieved: boolean
	onTrack: boolean | null
	daysRemaining: number | null
}

interface ProgressOverview {
	skills: SkillProgress[]
	goal: EnrichedGoal | null
}

interface LearningPathSkill {
	skill: string
	currentLevel: string
	targetLevel: string
	sessionsPerWeek: number
	focusArea: string | null
	recommendedLevel: string
	estimatedMinutes: number
	weakTopics: { id: string; name: string; masteryScore: number }[]
	priority: number
}

interface LearningPathResponse {
	weeklyPlan: LearningPathSkill[]
	totalMinutesPerWeek: number
	projectedImprovement: string | null
}

// Activity (from GET /api/progress/activity)
interface ActivityResponse {
	streak: number
	total: number
	activeDays: string[]
	totalExercises: number
	totalStudyTimeMinutes: number
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
	level: QuestionLevel
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

// Onboarding
interface OnboardingStatus {
	completed: boolean
	placement: {
		source: "self_assess" | "placement" | "skipped"
		confidence: "low" | "medium" | "high"
		levels: {
			listening: QuestionLevel
			reading: QuestionLevel
			writing: QuestionLevel
			speaking: QuestionLevel
		}
		estimatedBand: VstepBand | null
	} | null
	hasGoal: boolean
	needsVerification: boolean
}

interface PlacementResult {
	source: "self_assess" | "placement" | "skipped"
	confidence: "low" | "medium" | "high"
	levels: {
		listening: QuestionLevel
		reading: QuestionLevel
		writing: QuestionLevel
		speaking: QuestionLevel
	}
	estimatedBand: VstepBand | null
	weakPoints: { skill: string; category: string; name: string }[]
	needsVerification: boolean
}

interface PlacementStarted {
	sessionId: string
	examId: string
	questionCount: number
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

// Grading results
interface AutoResult {
	type: "auto"
	correctCount: number
	totalCount: number
	score: number
	band?: VstepBand
	gradedAt: string
}

interface AIResult {
	type: "ai"
	overallScore: number
	band?: VstepBand
	criteriaScores: Record<string, number>
	feedback: string
	grammarErrors?: { offset: number; length: number; message: string; suggestion?: string }[]
	confidence: "high" | "medium" | "low"
	gradedAt: string
}

interface HumanResult {
	type: "human"
	overallScore: number
	band?: VstepBand
	criteriaScores?: Record<string, number>
	feedback?: string
	reviewerId: string
	reviewedAt: string
	reviewComment?: string
}

type GradingResult = AutoResult | AIResult | HumanResult

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
	result: GradingResult | null
	feedback: string | null
}

// Knowledge Points
type KnowledgePointCategory = "grammar" | "vocabulary" | "strategy"

interface KnowledgePoint {
	id: string
	category: KnowledgePointCategory
	name: string
	createdAt: string
	updatedAt: string
}

interface TopicItem {
	id: string
	name: string
	questionCount: number
}

// Question with knowledge points (admin view)
interface QuestionWithKnowledgePoints extends Question {
	knowledgePointIds: string[]
}

// Vocabulary
interface VocabularyTopic {
	id: string
	name: string
	description: string
	iconKey: string | null
	wordCount: number
	sortOrder: number
	createdAt: string
	updatedAt: string
}

interface VocabularyWord {
	id: string
	word: string
	phonetic: string | null
	audioUrl: string | null
	partOfSpeech: string
	definition: string
	explanation: string
	examples: string[]
	sortOrder: number
	createdAt: string
	updatedAt: string
}

interface VocabularyTopicDetail {
	id: string
	name: string
	description: string
	iconKey: string | null
	sortOrder: number
	createdAt: string
	updatedAt: string
	words: VocabularyWord[]
}

interface VocabularyTopicProgress {
	knownWordIds: string[]
	totalWords: number
	knownCount: number
}

// Notifications
type NotificationType = "grading_complete" | "feedback" | "class_invite" | "system"

interface NotificationItem {
	id: string
	type: NotificationType
	title: string
	body: string | null
	data: unknown
	readAt: string | null
	createdAt: string
}

// Practice
interface PracticeNextResponse {
	question: {
		id: string
		skill: string
		level: string
		part: number
		content: unknown
		answerKey: unknown
		explanation: string | null
	} | null
	scaffoldLevel: number
	currentLevel: string
}

// AI
interface ParaphraseRequest {
	text: string
	skill: Skill
	context?: string
}

interface ParaphraseHighlight {
	phrase: string
	note: string
}

interface ParaphraseResponse {
	highlights: ParaphraseHighlight[]
}

interface ExplainRequest {
	text: string
	skill: Skill
	questionNumbers?: number[]
	answers?: Record<string, string>
	correctAnswers?: Record<string, string>
}

interface QuestionExplanation {
	questionNumber: number
	correctAnswer: string
	explanation: string
	wrongAnswerNote?: string
}

interface ExplainHighlight {
	phrase: string
	note: string
	category: "grammar" | "vocabulary" | "strategy" | "discourse"
}

interface ExplainResponse {
	highlights: ExplainHighlight[]
	questionExplanations?: QuestionExplanation[]
}

// Uploads
interface UploadAudioResponse {
	audioKey: string
}

export type {
	AIResult,
	ActivityResponse,
	AuthUser,
	AutoResult,
	EnrichedGoal,
	Exam,
	ExamAnswer,
	ExamBlueprint,
	ExamSession,
	ExamSessionDetail,
	ExamSessionWithExam,
	ExamType,
	ExplainHighlight,
	ExplainRequest,
	ExplainResponse,
	Goal,
	GradingMode,
	GradingResult,
	HumanResult,
	KnowledgePoint,
	KnowledgePointCategory,
	LearningPathResponse,
	LearningPathSkill,
	ListeningContent,
	LoginResponse,
	MCQItem,
	NotificationItem,
	NotificationType,
	ObjectiveAnswer,
	OnboardingStatus,
	PaginatedResponse,
	PaginationMeta,
	ParaphraseHighlight,
	ParaphraseRequest,
	ParaphraseResponse,
	PlacementResult,
	PlacementStarted,
	PracticeNextResponse,
	ProgressOverview,
	ProgressRecentScore,
	ProgressSkillDetail,
	Question,
	QuestionContent,
	QuestionExplanation,
	QuestionLevel,
	QuestionWithKnowledgePoints,
	ReadingContent,
	ReadingGapFillContent,
	ReadingMatchingContent,
	ReadingTNGContent,
	RegisterResponse,
	SessionAnswer,
	SessionExamEmbed,
	SessionQuestion,
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
	TopicItem,
	Trend,
	UploadAudioResponse,
	User,
	VocabularyTopic,
	VocabularyTopicDetail,
	VocabularyTopicProgress,
	VocabularyWord,
	VstepBand,
	WritingAnswer,
	WritingContent,
}
