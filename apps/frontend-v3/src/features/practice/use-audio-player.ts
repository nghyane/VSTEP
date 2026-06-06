import { useCallback, useEffect, useRef, useState } from "react"

interface AudioPlayer {
	playing: boolean
	currentTime: number
	duration: number
	progress: number
	toggle: () => void
	replay: () => void
	seek: (e: React.MouseEvent<HTMLDivElement>) => void
	audioRef: React.RefObject<HTMLAudioElement | null>
	barRef: React.RefObject<HTMLDivElement | null>
}

export function useAudioPlayer(onTimeUpdate?: (time: number) => void): AudioPlayer {
	const audioRef = useRef<HTMLAudioElement>(null)
	const barRef = useRef<HTMLDivElement>(null)
	const rafRef = useRef(0)
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const callbackRef = useRef(onTimeUpdate)
	callbackRef.current = onTimeUpdate

	const syncTime = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		setCurrentTime(audio.currentTime)
		callbackRef.current?.(audio.currentTime)
	}, [])

	const stopFrame = useCallback(() => {
		if (!rafRef.current) return
		cancelAnimationFrame(rafRef.current)
		rafRef.current = 0
	}, [])

	const startFrame = useCallback(() => {
		stopFrame()
		const tick = () => {
			syncTime()
			const audio = audioRef.current
			if (audio && !audio.paused && !audio.ended) rafRef.current = requestAnimationFrame(tick)
		}
		rafRef.current = requestAnimationFrame(tick)
	}, [stopFrame, syncTime])

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		const onDuration = () => {
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		const onPlay = () => {
			setPlaying(true)
			startFrame()
		}
		const onPause = () => {
			setPlaying(false)
			stopFrame()
			syncTime()
		}
		const onEnd = () => {
			setPlaying(false)
			stopFrame()
			syncTime()
		}
		audio.addEventListener("timeupdate", syncTime)
		audio.addEventListener("durationchange", onDuration)
		audio.addEventListener("loadedmetadata", onDuration)
		audio.addEventListener("play", onPlay)
		audio.addEventListener("pause", onPause)
		audio.addEventListener("ended", onEnd)
		return () => {
			stopFrame()
			audio.removeEventListener("timeupdate", syncTime)
			audio.removeEventListener("durationchange", onDuration)
			audio.removeEventListener("loadedmetadata", onDuration)
			audio.removeEventListener("play", onPlay)
			audio.removeEventListener("pause", onPause)
			audio.removeEventListener("ended", onEnd)
		}
	}, [startFrame, stopFrame, syncTime])

	const toggle = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		if (audio.paused) {
			void audio.play()
		} else {
			audio.pause()
		}
	}, [])

	const replay = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		audio.currentTime = 0
		void audio.play()
	}, [])

	const seek = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const bar = barRef.current
			const audio = audioRef.current
			if (!bar || !audio || !duration) return
			audio.currentTime =
				Math.max(0, Math.min((e.clientX - bar.getBoundingClientRect().left) / bar.clientWidth, 1)) * duration
		},
		[duration],
	)

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return { playing, currentTime, duration, progress, toggle, replay, seek, audioRef, barRef }
}
