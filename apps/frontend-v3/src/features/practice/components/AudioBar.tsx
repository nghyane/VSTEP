import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { formatAudioTime } from "#/lib/utils"

interface Props {
	src: string
}

export function AudioBar({ src }: Props) {
	const audioRef = useRef<HTMLAudioElement>(null)
	const barRef = useRef<HTMLDivElement>(null)
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		const onTime = () => setCurrentTime(audio.currentTime)
		const onDuration = () => { if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration) }
		const onEnd = () => setPlaying(false)
		audio.addEventListener("timeupdate", onTime)
		audio.addEventListener("durationchange", onDuration)
		audio.addEventListener("loadedmetadata", onDuration)
		audio.addEventListener("ended", onEnd)
		return () => { audio.removeEventListener("timeupdate", onTime); audio.removeEventListener("durationchange", onDuration); audio.removeEventListener("loadedmetadata", onDuration); audio.removeEventListener("ended", onEnd) }
	}, [])

	const toggle = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		if (audio.paused) { audio.play(); setPlaying(true) } else { audio.pause(); setPlaying(false) }
	}, [])

	const skip = useCallback((delta: number) => {
		const audio = audioRef.current
		if (!audio) return
		audio.currentTime = Math.max(0, Math.min(audio.currentTime + delta, audio.duration || 0))
	}, [])

	const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const bar = barRef.current
		const audio = audioRef.current
		if (!bar || !audio || !duration) return
		audio.currentTime = Math.max(0, Math.min((e.clientX - bar.getBoundingClientRect().left) / bar.clientWidth, 1)) * duration
	}, [duration])

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return (
		<div className="bg-surface border-t-2 border-border px-5 py-3">
			<div className="flex items-center gap-4">
				<button type="button" onClick={() => skip(-5)} className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-muted hover:text-foreground transition" aria-label="Tua lại 5s">
					<Icon name="back" size="xs" />
				</button>
				<button type="button" onClick={toggle} className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_4px_0_var(--color-primary-dark)] active:shadow-[0_2px_0_var(--color-primary-dark)] active:translate-y-[2px] transition" aria-label={playing ? "Tạm dừng" : "Phát"}>
					<Icon name={playing ? "close" : "volume"} size="sm" />
				</button>
				<button type="button" onClick={() => skip(5)} className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-muted hover:text-foreground transition rotate-180" aria-label="Tua tới 5s">
					<Icon name="back" size="xs" />
				</button>

				<span className="text-sm font-bold text-primary tabular-nums">{formatAudioTime(currentTime)}</span>

				<div ref={barRef} onClick={seek} className="flex-1 h-3 bg-background rounded-full cursor-pointer relative border-2 border-border" role="slider" aria-label="Tiến trình" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(currentTime)}>
					<div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width]" style={{ width: `${progress}%` }} />
				</div>

				<span className="text-sm text-muted tabular-nums">{formatAudioTime(duration)}</span>
			</div>
			<audio ref={audioRef} src={src} preload="metadata" className="hidden" />
		</div>
	)
}
