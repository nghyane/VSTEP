export type ConfigSchema =
	| { type: "auto" }
	| { type: "number"; min?: number; max?: number; integer?: boolean }
	| { type: "string" }
	| { type: "boolean" }
	| { type: "timezone"; options: string[] }
	| { type: "milestones" }
	| { type: "level_costs" }

export interface SystemConfigRow {
	key: string
	value: unknown
	description: string | null
	updated_at: string
	schema: ConfigSchema
}

export interface Milestone {
	days: number
	coins: number
}
