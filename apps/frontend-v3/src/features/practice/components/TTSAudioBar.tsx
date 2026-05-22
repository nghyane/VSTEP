import { Icon } from "#/components/Icon"
import { useSmoothProgressBar } from "#/features/practice/use-smooth-progress-bar"
import { TTS_SPEED_LABELS, type TTSPlayer, type TTSSpeed } from "#/features/practice/use-tts-player"

interface Props {
	player: TTSPlayer
}

const SPEEDS: TTSSpeed[] = [0.7, 0.85, 1]

export function TTSAudioBar({ player }: Props) {
	const fillRef = useSmoothProgressBar({
		playing: player.playing,
		activeWordIndex: player.activeWordIndex,
		totalWords: player.totalWords,
		wordDuration: player.wordDuration,
	})

	const cycleSpeed = () => {
		const idx = SPEEDS.indexOf(player.speed)
		player.setSpeed(SPEEDS[(idx + 1) % SPEEDS.length])
	}

	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				onClick={player.toggle}
				className="w-10 h-10 rounded-full bg-skill-listening text-primary-foreground flex items-center justify-center shadow-[0_3px_0_var(--color-skill-listening-dark)] active:shadow-[0_1px_0_var(--color-skill-listening-dark)] active:translate-y-[2px] transition shrink-0"
				aria-label={player.playing ? "Tạm dừng" : "Phát"}
			>
				<Icon name={player.playing ? "volume" : "play"} size="xs" />
			</button>
			<div className="flex-1 h-2 bg-background rounded-full relative border border-border min-w-0">
				<div ref={fillRef} className="absolute inset-y-0 left-0 bg-skill-listening rounded-full w-0" />
			</div>
			<button
				type="button"
				onClick={cycleSpeed}
				className="px-2 py-0.5 text-[10px] font-bold text-muted border-2 border-border rounded-(--radius-button) hover:text-foreground hover:border-foreground/30 transition shrink-0 uppercase"
				title={TTS_SPEED_LABELS[player.speed]}
			>
				{player.speed}x
			</button>
		</div>
	)
}
