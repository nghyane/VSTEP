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
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const callbackRef = useRef(onTimeUpdate)
	callbackRef.current = onTimeUpdate

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		const onTime = () => {
			setCurrentTime(audio.currentTime)
			callbackRef.current?.(audio.currentTime)
		}
		const onDuration = () => {
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		const onEnd = () => setPlaying(false)
		audio.addEventListener("timeupdate", onTime)
		audio.addEventListener("durationchange", onDuration)
		audio.addEventListener("loadedmetadata", onDuration)
		audio.addEventListener("ended", onEnd)
		return () => {
			audio.removeEventListener("timeupdate", onTime)
			audio.removeEventListener("durationchange", onDuration)
			audio.removeEventListener("loadedmetadata", onDuration)
			audio.removeEventListener("ended", onEnd)
		}
	}, [])

	const toggle = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		if (audio.paused) {
			audio.play()
			setPlaying(true)
		} else {
			audio.pause()
			setPlaying(false)
		}
	}, [])

	const replay = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		audio.currentTime = 0
		audio.play()
		setPlaying(true)
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
