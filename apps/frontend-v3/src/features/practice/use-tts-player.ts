import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getEnglishVoices, pickEnglishVoice, speak, stopSpeaking } from "#/lib/utils"

export interface DialogueTurn {
	speaker: string
	text: string
	globalWordStart: number
	globalWordEnd: number
}

export type TTSSpeed = 0.7 | 0.85 | 1

export const TTS_SPEED_LABELS: Record<TTSSpeed, string> = {
	0.7: "Chậm",
	0.85: "Bình thường",
	1: "Nhanh",
}

export interface TTSPlayer {
	playing: boolean
	activeWordIndex: number
	activeTurnIndex: number
	totalWords: number
	progress: number
	wordDuration: number
	turns: DialogueTurn[]
	speed: TTSSpeed
	setSpeed: (s: TTSSpeed) => void
	toggle: () => void
	replay: () => void
}

const SPEAKER_RE = /^([A-Z][A-Za-z\s]+):\s*/

function parseDialogue(transcript: string): DialogueTurn[] {
	const rawLines = transcript
		.split(/\n+/)
		.map((l) => l.trim())
		.filter(Boolean)
	const turns: DialogueTurn[] = []
	let lastSpeaker = ""

	for (const line of rawLines) {
		const match = SPEAKER_RE.exec(line)
		if (match) {
			const speaker = match[1].trim()
			const text = line.slice(match[0].length).trim()
			if (text) {
				turns.push({ speaker, text, globalWordStart: 0, globalWordEnd: 0 })
				lastSpeaker = speaker
			}
		} else if (turns.length > 0 && lastSpeaker) {
			turns[turns.length - 1].text += ` ${line}`
		} else {
			turns.push({ speaker: "", text: line, globalWordStart: 0, globalWordEnd: 0 })
		}
	}

	if (turns.length <= 1 && turns.every((t) => !t.speaker)) {
		const sentences = transcript.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim())
		turns.length = 0
		for (const s of sentences) {
			turns.push({ speaker: "", text: s.trim(), globalWordStart: 0, globalWordEnd: 0 })
		}
	}

	let wordCount = 0
	for (const turn of turns) {
		turn.globalWordStart = wordCount
		const count = (turn.text.match(/\S+/g) ?? []).length
		turn.globalWordEnd = wordCount + count - 1
		wordCount += count
	}

	return turns
}

function pickSecondVoice(primary: SpeechSynthesisVoice | undefined): SpeechSynthesisVoice | undefined {
	const voices = getEnglishVoices()
	if (voices.length < 2) return primary
	return voices.find((v) => v !== primary) ?? primary
}

/** Estimate ms per word at given TTS rate. ~150 wpm at rate 1.0 → ~400ms/word */
function msPerWord(rate: number): number {
	return 400 / rate
}

/** Extract word char positions from text */
function computeWordPositions(text: string): { start: number; end: number }[] {
	const positions: { start: number; end: number }[] = []
	const regex = /\S+/g
	let m = regex.exec(text)
	while (m) {
		positions.push({ start: m.index, end: m.index + m[0].length })
		m = regex.exec(text)
	}
	return positions
}

/** Map a charIndex from onBoundary to a global word index */
function findWordAtChar(
	charIndex: number,
	positions: { start: number; end: number }[],
	globalStart: number,
): number {
	for (let i = 0; i < positions.length; i++) {
		if (charIndex >= positions[i].start && charIndex < positions[i].end) return globalStart + i
	}
	for (let i = positions.length - 1; i >= 0; i--) {
		if (charIndex >= positions[i].start) return globalStart + i
	}
	return globalStart
}

export function useTTSPlayer(transcript: string | null): TTSPlayer {
	const [playing, setPlaying] = useState(false)
	const [activeWordIndex, setActiveWordIndex] = useState(-1)
	const [activeTurnIndex, setActiveTurnIndex] = useState(-1)
	const [speed, setSpeed] = useState<TTSSpeed>(0.85)
	const cancelledRef = useRef(false)
	const wordTimerRef = useRef(0)

	const turns = useMemo(() => (transcript ? parseDialogue(transcript) : []), [transcript])
	const totalWords = turns.length > 0 ? turns[turns.length - 1].globalWordEnd + 1 : 0

	const [primaryVoice, setPrimaryVoice] = useState<SpeechSynthesisVoice | undefined>(() => pickEnglishVoice())
	useEffect(() => {
		if (primaryVoice) return
		const load = () => {
			const v = pickEnglishVoice()
			if (v) setPrimaryVoice(v)
		}
		window.speechSynthesis?.addEventListener("voiceschanged", load)
		return () => window.speechSynthesis?.removeEventListener("voiceschanged", load)
	}, [primaryVoice])

	const secondVoice = useMemo(() => pickSecondVoice(primaryVoice), [primaryVoice])

	const speakerVoices = useMemo(() => {
		const speakers = [...new Set(turns.filter((t) => t.speaker).map((t) => t.speaker))]
		const map = new Map<string, SpeechSynthesisVoice | undefined>()
		for (let i = 0; i < speakers.length; i++) {
			map.set(speakers[i], i === 0 ? primaryVoice : secondVoice)
		}
		return map
	}, [turns, primaryVoice, secondVoice])

	const clearWordTimer = useCallback(() => {
		if (wordTimerRef.current) {
			clearInterval(wordTimerRef.current)
			wordTimerRef.current = 0
		}
	}, [])

	const stop = useCallback(() => {
		cancelledRef.current = true
		clearWordTimer()
		stopSpeaking()
		setPlaying(false)
	}, [clearWordTimer])

	const startWordTimer = useCallback(
		(turn: DialogueTurn, rate: number) => {
			clearWordTimer()
			const wordCount = turn.globalWordEnd - turn.globalWordStart + 1
			let currentWord = 0
			setActiveWordIndex(turn.globalWordStart)
			wordTimerRef.current = window.setInterval(() => {
				currentWord++
				if (currentWord >= wordCount) {
					clearWordTimer()
					return
				}
				setActiveWordIndex(turn.globalWordStart + currentWord)
			}, msPerWord(rate))
		},
		[clearWordTimer],
	)

	const speakTurn = useCallback(
		(turnIdx: number) => {
			if (turnIdx >= turns.length || cancelledRef.current) {
				setPlaying(false)
				clearWordTimer()
				if (turns.length > 0) {
					setActiveWordIndex(turns[turns.length - 1].globalWordEnd)
					setActiveTurnIndex(turns.length - 1)
				}
				return
			}

			const turn = turns[turnIdx]
			setActiveTurnIndex(turnIdx)
			const wordPositions = computeWordPositions(turn.text)
			const voice = speakerVoices.get(turn.speaker) ?? primaryVoice

			startWordTimer(turn, speed)

			speak(turn.text, {
				rate: speed,
				voice,
				skipCancel: true,
				onBoundary: (charIndex) => {
					if (wordTimerRef.current) clearWordTimer()
					setActiveWordIndex(findWordAtChar(charIndex, wordPositions, turn.globalWordStart))
				},
				onEnd: () => {
					if (cancelledRef.current) return
					clearWordTimer()
					setActiveWordIndex(turn.globalWordEnd)
					const delay = turns.some((t) => t.speaker) ? 600 : 400
					setTimeout(() => {
						if (!cancelledRef.current) speakTurn(turnIdx + 1)
					}, delay)
				},
			})
		},
		[turns, speakerVoices, primaryVoice, speed, startWordTimer, clearWordTimer],
	)

	const startSpeaking = useCallback(() => {
		if (!transcript || turns.length === 0) return
		cancelledRef.current = false
		setPlaying(true)
		setActiveWordIndex(-1)
		setActiveTurnIndex(-1)
		speakTurn(0)
	}, [transcript, turns, speakTurn])

	const toggle = useCallback(() => {
		if (playing) stop()
		else startSpeaking()
	}, [playing, stop, startSpeaking])

	const replay = useCallback(() => {
		stop()
		setTimeout(() => startSpeaking(), 100)
	}, [stop, startSpeaking])

	useEffect(() => {
		return () => {
			stopSpeaking()
			clearWordTimer()
		}
	}, [clearWordTimer])

	const progress = totalWords > 0 && activeWordIndex >= 0 ? ((activeWordIndex + 1) / totalWords) * 100 : 0

	return {
		playing,
		activeWordIndex,
		activeTurnIndex,
		totalWords,
		progress,
		wordDuration: msPerWord(speed),
		turns,
		speed,
		setSpeed,
		toggle,
		replay,
	}
}
