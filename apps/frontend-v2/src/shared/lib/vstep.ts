// Shared VSTEP taxonomy types — dùng chung cho grammar, vocabulary, và các module khác.

export type VstepLevel = "B1" | "B2" | "C1"

export type VstepTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ"

export type GrammarFunction = "accuracy" | "range" | "coherence" | "register"

export const LEVEL_LABELS: Record<VstepLevel, string> = {
	B1: "Nền tảng B1",
	B2: "Nâng cao B2",
	C1: "Tinh chỉnh C1",
}

export const TASK_LABELS: Record<VstepTask, string> = {
	WT1: "Writing Task 1",
	WT2: "Writing Task 2",
	SP1: "Speaking Part 1",
	SP2: "Speaking Part 2",
	SP3: "Speaking Part 3",
	READ: "Reading",
}
