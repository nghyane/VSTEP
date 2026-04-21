import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { formatAudioTime } from "#/lib/utils"
import { cn } from "#/lib/utils"

interface Props {
	src: string
	onToggleSubtitle: () => void
	subtitleOn: boolean
}

export function AudioBar({ src, onToggleSubtitle, subtitleOn }: Props) {
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

	const replay = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		audio.currentTime = 0
		audio.play()
		setPlaying(true)
	}, [])

	const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const bar = barRef.current
		const audio = audioRef.current
		if (!bar || !audio || !duration) return
		audio.currentTime = Math.max(0, Math.min((e.clientX - bar.getBoundingClientRect().left) / bar.clientWidth, 1)) * duration
	}, [duration])

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return (
		<div className="flex items-center gap-3">
			<button type="button" onClick={toggle} className="w-10 h-10 rounded-full bg-skill-listening text-primary-foreground flex items-center justify-center shadow-[0_3px_0_oklch(0.45_0.15_240)] active:shadow-[0_1px_0_oklch(0.45_0.15_240)] active:translate-y-[2px] transition shrink-0" aria-label={playing ? "Tạm dừng" : "Phát"}>
				<Icon name={playing ? "close" : "volume"} size="xs" />
			</button>
			<button type="button" onClick={replay} className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-muted hover:text-foreground transition shrink-0" aria-label="Nghe lại">
				<Icon name="back" size="xs" />
			</button>
			<div ref={barRef} onClick={seek} className="flex-1 h-2 bg-background rounded-full relative border border-border cursor-pointer min-w-0">
				<div className="absolute inset-y-0 left-0 bg-skill-listening rounded-full transition-[width]" style={{ width: `${progress}%` }} />
			</div>
			<span className="text-xs text-muted tabular-nums shrink-0">{formatAudioTime(currentTime)} / {formatAudioTime(duration)}</span>
			<button
				type="button"
				onClick={onToggleSubtitle}
				className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition shrink-0", subtitleOn ? "border-skill-listening bg-info-tint text-skill-listening" : "border-border text-muted")}
				aria-label="Bật/tắt phụ đề"
			>
				CC
			</button>
			<audio ref={audioRef} src={src} preload="metadata" className="hidden" />
		</div>
	)
}
