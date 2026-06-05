/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface SpeechRecognitionAlternative {
	transcript: string
	confidence: number
}

interface SpeechRecognitionResult {
	readonly length: number
	readonly isFinal: boolean
	[index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
	readonly length: number
	[index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
	readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
	readonly error: string
	readonly message: string
}

interface SpeechRecognition extends EventTarget {
	lang: string
	continuous: boolean
	interimResults: boolean
	maxAlternatives: number
	onresult: ((this: SpeechRecognition, event: SpeechRecognitionEvent) => void) | null
	onerror: ((this: SpeechRecognition, event: SpeechRecognitionErrorEvent) => void) | null
	onend: ((this: SpeechRecognition, event: Event) => void) | null
	start: () => void
	stop: () => void
	abort: () => void
}

interface SpeechRecognitionConstructor {
	new (): SpeechRecognition
}

interface Window {
	SpeechRecognition?: SpeechRecognitionConstructor
	webkitSpeechRecognition?: SpeechRecognitionConstructor
}
