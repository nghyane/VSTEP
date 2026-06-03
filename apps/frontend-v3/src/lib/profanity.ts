export interface ProfanityDiagnostic {
	found: boolean
	words: string[]
	count: number
}

const PROFANITY_WORDS = new Set([
	"fuck",
	"shit",
	"bitch",
	"asshole",
	"bastard",
	"damn",
	"crap",
	"dick",
	"piss",
	"slut",
	"whore",
	"moron",
	"idiot",
	"stupid",
	"dumb",
	"suck",
	"hell",
	"fucker",
	"fucking",
	"motherfucker",
	"motherfuckers",
	"motherfucking",
	"shitty",
	"bullshit",
	"bitches",
	"assholes",
	"dicks",
	"prick",
	"pricks",
	"cunt",
	"cunts",
	"wanker",
	"wankers",
	"twat",
	"twats",
	"dit",
	"dm",
	"dmm",
	"cl",
	"lon",
	"cac",
	"buoi",
	"địt",
	"đm",
	"đmm",
	"lồn",
	"cặc",
	"buồi",
	"ditme",
	"ditmemay",
	"dume",
	"dumemay",
	"du",
	"đụ",
	"đụmá",
	"đụmẹ",
])

export function detectProfanity(text: string): ProfanityDiagnostic {
	const words = text
		.toLowerCase()
		.replace(/[^\p{L}\s]+/gu, " ")
		.split(/\s+/)
		.filter((word) => word.length > 0)
	const found = words.filter((word) => PROFANITY_WORDS.has(word))
	const unique = Array.from(new Set(found))

	return {
		found: unique.length > 0,
		words: unique,
		count: found.length,
	}
}

export function censorProfanityWords(words: string[]): string {
	return words.map(censorWord).join(", ")
}

export function censorProfanityText(text: string): string {
	return text.replace(/[\p{L}]+/gu, (word) =>
		PROFANITY_WORDS.has(word.toLowerCase()) ? censorWord(word) : word,
	)
}

function censorWord(word: string): string {
	if (word.length <= 2) return "*".repeat(word.length)
	return `${word[0]}${"*".repeat(word.length - 2)}${word[word.length - 1]}`
}
