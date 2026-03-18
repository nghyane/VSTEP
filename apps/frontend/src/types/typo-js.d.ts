declare module "typo-js" {
	class Typo {
		constructor(lang: string, affData?: string, wordsData?: string)
		check(word: string): boolean
		suggest(word: string): string[]
	}
	export default Typo
}

declare module "typo-js/dictionaries/en_US/en_US.aff?raw" {
	const content: string
	export default content
}

declare module "typo-js/dictionaries/en_US/en_US.dic?raw" {
	const content: string
	export default content
}
