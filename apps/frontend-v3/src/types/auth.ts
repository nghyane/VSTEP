export type AvatarKey =
	| "Alex"
	| "Jordan"
	| "Sam"
	| "Riley"
	| "Casey"
	| "Morgan"
	| "Taylor"
	| "Drew"
	| "Quinn"
	| "Avery"
	| "Blake"
	| "Cameron"
	| "Dakota"
	| "Emery"
	| "Finley"
	| "Hayden"
	| "Indigo"
	| "Jesse"
	| "Kai"
	| "Logan"
	| "Mason"
	| "Noah"
	| "Oakley"
	| "Parker"
	| "Reese"
	| "Sage"
	| "Skyler"
	| "Tatum"
	| "Winter"
	| "Zion"

export interface User {
	id: string
	email: string
	phone_number: string | null
	role: string
	avatar_key: AvatarKey | null
	avatar_url: string | null
	has_password: boolean
}

export interface Profile {
	id: string
	nickname: string
	target_level: string
	target_deadline: string
	avatar_color: string | null
	avatar_key: AvatarKey | null
	avatar_url: string | null
	is_initial_profile: boolean
	created_at: string
}
