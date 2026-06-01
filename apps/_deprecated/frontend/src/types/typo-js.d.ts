declare module "typo-js" {
	class Typo {
		constructor(lang: string, affData?: string, wordsData?: string)
		check(word: string): boolean
		suggest(word: string): string[]
	}
	export default Typo
}
