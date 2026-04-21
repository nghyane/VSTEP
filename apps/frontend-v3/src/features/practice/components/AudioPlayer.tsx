import { useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import type { ListeningExercise } from "#/features/practice/types"

interface Props {
	exercise: ListeningExercise
}

export function AudioPlayer({ exercise }: Props) {
	const audioRef = useRef<HTMLAudioElement>(null)
	const [playing, setPlaying] = useState(false)

	function toggle() {
		const audio = audioRef.current
		if (!audio) return
		if (playing) {
			audio.pause()
		} else {
			audio.play()
		}
		setPlaying(!playing)
	}

	return (
		<div className="card p-5">
			<div className="flex items-center gap-4">
				<button type="button" onClick={toggle} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
					<Icon name={playing ? "close" : "volume"} size="sm" className="text-primary-foreground" />
				</button>
				<div className="flex-1 min-w-0">
					<h3 className="font-bold text-base text-foreground">{exercise.title}</h3>
					{exercise.description && <p className="text-sm text-muted mt-0.5">{exercise.description}</p>}
					<p className="text-xs text-subtle mt-1">Part {exercise.part}{exercise.estimated_minutes ? ` · ~${exercise.estimated_minutes} phút` : ""}</p>
				</div>
			</div>
			<audio ref={audioRef} src={exercise.audio_url} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
		</div>
	)
}
