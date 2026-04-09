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
	listening?: { questionIds: string[]; questionCount?: number }
	reading?: { questionIds: string[]; questionCount?: number }
	writing?: { questionIds: string[]; questionCount?: number }
	speaking?: { questionIds: string[]; questionCount?: number }
	durationMinutes?: number
}

interface ExamSection {
	skill: Skill
	part: number
	sectionType: "objective_group" | "writing_task" | "speaking_part"
	objectiveItemCount: number
	entryCount: number
	bankEntryIds: string[]
	questionIds: string[]
	questionCount: number
	order: number
	title?: string | null
	instructions?: string | null
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
	objectiveQuestionCount?: number
	sectionCount?: number
	sections?: ExamSection[]
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
	answerKey?: { correctAnswers: Record<string, string> | string[] } | null
	explanation?: string | null
}

interface SessionAnswer {
	questionId: string
	answer: SubmissionAnswer
	isCorrect: boolean | null
	rawRatio: number | null
}

interface ExamSessionDetail extends ExamSession {
	questions: SessionQuestion[]
	answers: SessionAnswer[]
	submissions: SubmissionFull[]
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
	topic: string | null
	content: QuestionContent
	answerKey?: { correctAnswers: Record<string, string> | string[] } | null
	explanation?: string | null
	isActive: boolean
	createdBy: string | null
	createdAt: string
	updatedAt: string
}

// Answer types
interface ObjectiveAnswer {
	answers: Record<string, string> | string[]
}

interface WritingAnswer {
	text: string
}

interface SpeakingAnswer {
	audioPath: string
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
	annotations?: {
		strengthQuotes: {
			phrase: string
			note: string
			type: "structure" | "collocation" | "transition"
		}[]
		corrections: {
			original: string
			correction: string
			type: "grammar" | "vocabulary" | "spelling"
			explanation: string
		}[]
		rewriteSuggestion: {
			original: string
			correction: string
			note: string
		} | null
	}
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
	question?: Question
	practiceSession?: {
		config?: {
			writingTier?: WritingTier
		} | null
	} | null
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

// Sentences
interface SentenceTopic {
	id: string
	name: string
	description: string
	iconKey: string | null
	sentenceCount: number
	sortOrder: number
	createdAt: string
	updatedAt: string
}

interface SentenceItemData {
	id: string
	topicId: string
	sentence: string
	audioUrl: string | null
	translation: string
	explanation: string
	writingUsage: string
	difficulty: "easy" | "medium" | "hard"
	sortOrder: number
	createdAt: string
	updatedAt: string
}

interface SentenceTopicDetail {
	id: string
	name: string
	description: string
	iconKey: string | null
	sortOrder: number
	createdAt: string
	updatedAt: string
	sentences: SentenceItemData[]
}

interface SentenceTopicProgress {
	masteredSentenceIds: string[]
	totalSentences: number
	masteredCount: number
}

// Notifications
type NotificationType = "grading_complete" | "feedback" | "class_invite" | "system"

interface NotificationItem {
	id: string
	type: NotificationType
	title: string
	body: string | null
	data: {
		submissionId?: string
		score?: number
		skill?: Skill
	} | null
	url?: string | null
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

type PracticeMode = "guided" | "free"

interface PracticeSession {
	id: string
	skill: Skill
	mode: PracticeMode
	level: QuestionLevel
	config: {
		focusKp: string | null
		itemsCount: number
		writingTier: WritingTier | null
		topic: string | null
		part: number | null
	}
	currentQuestionId: string | null
	summary: unknown | null
	startedAt: string
	completedAt: string | null
	createdAt: string
	updatedAt: string
}

interface WritingHints {
	outline: string[]
	starters: string[]
	wordCount: string
}

interface WritingScaffoldBlankHints {
	b1: string[]
	b2: string[]
}

interface WritingScaffoldPart {
	type: "text" | "blank"
	content?: string
	id?: string
	label?: string
	variant?: "transition" | "content"
	hints?: WritingScaffoldBlankHints
}

interface WritingScaffoldSection {
	title: string
	parts: WritingScaffoldPart[]
}

interface WritingTemplateScaffoldPayload {
	sections: WritingScaffoldSection[]
}

type WritingScaffoldType = "template" | "guided" | "freeform"

interface WritingScaffold {
	questionId: string
	tier: WritingTier
	requestedTier?: WritingTier
	effectiveTier?: WritingTier
	type: WritingScaffoldType
	payload: WritingTemplateScaffoldPayload | WritingHints | null
	fallbackReason?: "template_unavailable" | null
}

interface PracticeItem {
	question: Question
	difficulty: string
	isReview: boolean
	writingScaffold?: WritingScaffold
}

interface PracticeRecommendation {
	isFirstTime: boolean
	reviewDue: number
	topPatterns: Record<string, number>
	suggestedFocus: string | null
}

type WritingTier = 1 | 2 | 3

interface PracticeStartResponse {
	session: PracticeSession
	currentItem: PracticeItem | null
	recommendation: PracticeRecommendation
	progress: { current: number; total: number; hasMore: boolean }
	writingTier: WritingTier | null
}

interface PracticeSubmitResponse {
	result: {
		type: string
		status?: string
		score?: number
		correct?: boolean
		total?: number
		rawRatio?: number
		allCorrect?: boolean
		userAnswers?: Record<string, string | null>
		correctAnswers?: Record<string, string | null>
		items?: {
			questionNumber: number
			userAnswer: string | null
			correctAnswer: string | null
			isCorrect: boolean
		}[]
	}
	submissionId: string
	canRetry: boolean
	isRetry: boolean
	previousScore: number | null
	improvement: number | null
	attemptNumber: number
	currentItem: PracticeItem | null
	progress: { current: number; total: number; hasMore: boolean }
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
	ExamSection,
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
	PracticeItem,
	PracticeMode,
	PracticeNextResponse,
	PracticeRecommendation,
	PracticeSession,
	PracticeStartResponse,
	PracticeSubmitResponse,
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
	SentenceItemData,
	SentenceTopic,
	SentenceTopicDetail,
	SentenceTopicProgress,
	VocabularyTopic,
	VocabularyTopicDetail,
	VocabularyTopicProgress,
	VocabularyWord,
	VstepBand,
	WritingAnswer,
	WritingContent,
	WritingScaffold,
	WritingScaffoldPart,
	WritingScaffoldSection,
	WritingScaffoldType,
	WritingHints,
	WritingTier,
}
