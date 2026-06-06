import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "#/lib/toast"
import {
	getEnglishVoices,
	pickBoundaryEnglishVoice,
	pickEnglishVoice,
	speak,
	stopSpeaking,
} from "#/lib/utils"

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
	voice: SpeechSynthesisVoice | undefined
	setSpeed: (s: TTSSpeed) => void
	setVoice: (voice: SpeechSynthesisVoice) => void
	toggle: () => void
	replay: () => void
}

const SPEAKER_RE = /^([A-Z][A-Za-z0-9\s.-]*):\s*/
const VOICE_ERROR_MESSAGE =
	"Giọng đọc này không phát được trên trình duyệt hiện tại. Vui lòng chọn giọng khác."

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

function textFromWordOffset(text: string, wordOffset: number): string {
	if (wordOffset <= 0) return text
	const positions = computeWordPositions(text)
	const position = positions[wordOffset]
	return position ? text.slice(position.start) : text
}

export function useTTSPlayer(transcript: string | null): TTSPlayer {
	const [playing, setPlaying] = useState(false)
	const [activeWordIndex, setActiveWordIndex] = useState(-1)
	const [activeTurnIndex, setActiveTurnIndex] = useState(-1)
	const [speed, setSpeed] = useState<TTSSpeed>(1)
	const cancelledRef = useRef(false)
	const activeWordIndexRef = useRef(-1)
	const activeTurnIndexRef = useRef(-1)

	const turns = useMemo(() => (transcript ? parseDialogue(transcript) : []), [transcript])
	const totalWords = turns.length > 0 ? turns[turns.length - 1].globalWordEnd + 1 : 0

	const [primaryVoice, setPrimaryVoice] = useState<SpeechSynthesisVoice | undefined>(() =>
		pickBoundaryEnglishVoice(),
	)
	useEffect(() => {
		if (primaryVoice) return
		const load = () => {
			const v = pickBoundaryEnglishVoice() ?? pickEnglishVoice()
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

	const setActiveWord = useCallback((index: number) => {
		activeWordIndexRef.current = index
		setActiveWordIndex(index)
	}, [])

	const setActiveTurn = useCallback((index: number) => {
		activeTurnIndexRef.current = index
		setActiveTurnIndex(index)
	}, [])

	const stop = useCallback(() => {
		cancelledRef.current = true
		stopSpeaking()
		setPlaying(false)
	}, [])

	const selectVoice = useCallback(
		(voice: SpeechSynthesisVoice) => {
			stop()
			setPrimaryVoice(voice)
		},
		[stop],
	)

	const speakTurn = useCallback(
		(turnIdx: number, startWordOffset = 0) => {
			if (cancelledRef.current) {
				setPlaying(false)
				return
			}
			if (turnIdx >= turns.length) {
				setPlaying(false)
				if (turns.length > 0) {
					setActiveWord(turns[turns.length - 1].globalWordEnd)
					setActiveTurn(turns.length - 1)
				}
				return
			}

			const turn = turns[turnIdx]
			const safeStartWordOffset = Math.max(
				0,
				Math.min(startWordOffset, turn.globalWordEnd - turn.globalWordStart),
			)
			const text = textFromWordOffset(turn.text, safeStartWordOffset)
			setActiveTurn(turnIdx)
			const wordPositions = computeWordPositions(text)
			const voice = speakerVoices.get(turn.speaker) ?? primaryVoice

			speak(text, {
				rate: speed,
				voice,
				skipCancel: true,
				boundaryFallback: false,
				onError: () => {
					setPlaying(false)
					useToast.getState().add(VOICE_ERROR_MESSAGE)
				},
				onBoundary: (charIndex) => {
					setActiveWord(findWordAtChar(charIndex, wordPositions, turn.globalWordStart + safeStartWordOffset))
				},
				onEnd: () => {
					if (cancelledRef.current) return
					setActiveWord(turn.globalWordEnd)
					const delay = turns.some((t) => t.speaker) ? 600 : 400
					setTimeout(() => {
						if (!cancelledRef.current) speakTurn(turnIdx + 1)
					}, delay)
				},
			})
		},
		[turns, speakerVoices, primaryVoice, speed, setActiveWord, setActiveTurn],
	)

	const startSpeaking = useCallback(
		(resume = false) => {
			if (!transcript || turns.length === 0) return
			cancelledRef.current = false
			setPlaying(true)
			if (!resume || activeWordIndexRef.current < 0 || activeWordIndexRef.current >= totalWords - 1) {
				setActiveWord(-1)
				setActiveTurn(-1)
				speakTurn(0)
				return
			}
			const turnIdx = Math.max(0, activeTurnIndexRef.current)
			const turn = turns[turnIdx]
			const startWordOffset = turn ? Math.max(0, activeWordIndexRef.current - turn.globalWordStart) : 0
			speakTurn(turnIdx, startWordOffset)
		},
		[transcript, turns, totalWords, speakTurn, setActiveWord, setActiveTurn],
	)

	const toggle = useCallback(() => {
		if (playing) stop()
		else startSpeaking(true)
	}, [playing, stop, startSpeaking])

	const replay = useCallback(() => {
		stop()
		setTimeout(() => startSpeaking(), 100)
	}, [stop, startSpeaking])

	useEffect(() => {
		return () => {
			stopSpeaking()
		}
	}, [])

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
		voice: primaryVoice,
		setSpeed,
		setVoice: selectVoice,
		toggle,
		replay,
	}
}
