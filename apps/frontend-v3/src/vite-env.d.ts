/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface Window {
	SpeechRecognition: typeof SpeechRecognition
	webkitSpeechRecognition: typeof SpeechRecognition
}
