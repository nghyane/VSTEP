import {
	GoBackwardFiveSecIcon,
	GoForwardFiveSecIcon,
	PauseIcon,
	PlayIcon,
	VolumeHighIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { formatTime } from "@/routes/_focused/-components/shared/exercise-shared"

export function ListeningPracticeAudioBar({ src }: { src: string }) {
	const audioRef = useRef<HTMLAudioElement>(null)
	const progressRef = useRef<HTMLDivElement>(null)
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		const onTimeUpdate = () => setCurrentTime(audio.currentTime)
		const onDurationChange = () => {
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		const onEnded = () => setPlaying(false)

		audio.addEventListener("timeupdate", onTimeUpdate)
		audio.addEventListener("durationchange", onDurationChange)
		audio.addEventListener("loadedmetadata", onDurationChange)
		audio.addEventListener("ended", onEnded)
		return () => {
			audio.removeEventListener("timeupdate", onTimeUpdate)
			audio.removeEventListener("durationchange", onDurationChange)
			audio.removeEventListener("loadedmetadata", onDurationChange)
			audio.removeEventListener("ended", onEnded)
		}
	}, [])

	const togglePlay = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		if (audio.paused) {
			audio.play().catch(() => {})
			setPlaying(true)
		} else {
			audio.pause()
			setPlaying(false)
		}
	}, [])

	const skip = useCallback((delta: number) => {
		const audio = audioRef.current
		if (!audio) return
		audio.currentTime = Math.max(0, Math.min(audio.currentTime + delta, audio.duration || 0))
	}, [])

	const handleSeek = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const bar = progressRef.current
			const audio = audioRef.current
			if (!bar || !audio || !duration) return
			const rect = bar.getBoundingClientRect()
			const ratio = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
			audio.currentTime = ratio * duration
		},
		[duration],
	)

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return (
		<div className="border-t bg-muted/10 px-4 py-2">
			<div className="flex items-center gap-3">
				{/* Skip backward 5s */}
				<button
					type="button"
					onClick={() => skip(-5)}
					className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<HugeiconsIcon icon={GoBackwardFiveSecIcon} className="size-4" />
				</button>

				{/* Play / Pause */}
				<button
					type="button"
					onClick={togglePlay}
					className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} className="size-4" />
				</button>

				{/* Skip forward 5s */}
				<button
					type="button"
					onClick={() => skip(5)}
					className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<HugeiconsIcon icon={GoForwardFiveSecIcon} className="size-4" />
				</button>

				{/* Current time */}
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={VolumeHighIcon} className="size-4 text-muted-foreground" />
					<span className="font-mono text-xs font-semibold tabular-nums text-primary">
						{formatTime(currentTime)}
					</span>
				</div>

				{/* Seekable progress bar */}
				<div
					ref={progressRef}
					role="slider"
					tabIndex={0}
					aria-label="Audio progress"
					aria-valuemin={0}
					aria-valuemax={Math.round(duration)}
					aria-valuenow={Math.round(currentTime)}
					className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-muted"
					onClick={handleSeek}
					onKeyDown={(e) => {
						if (e.key === "ArrowRight") skip(5)
						else if (e.key === "ArrowLeft") skip(-5)
					}}
				>
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-150"
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Duration */}
				<span className="font-mono text-xs tabular-nums text-muted-foreground">
					{formatTime(duration)}
				</span>
			</div>

			{/* biome-ignore lint/a11y/useMediaCaption: VSTEP listening practice audio */}
			<audio ref={audioRef} src={src} preload="metadata" className="hidden" />
		</div>
	)
}
