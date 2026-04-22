import { Icon } from "#/components/Icon"
import { useAudioPlayer } from "#/features/practice/use-audio-player"
import { formatAudioTime } from "#/lib/utils"

interface Props {
	src: string
	onTimeUpdate?: (time: number) => void
}

export function AudioBar({ src, onTimeUpdate }: Props) {
	const player = useAudioPlayer(onTimeUpdate)

	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				onClick={player.toggle}
				className="w-10 h-10 rounded-full bg-skill-listening text-primary-foreground flex items-center justify-center shadow-[0_3px_0_var(--color-skill-listening-dark)] active:shadow-[0_1px_0_var(--color-skill-listening-dark)] active:translate-y-[2px] transition shrink-0"
				aria-label={player.playing ? "Tạm dừng" : "Phát"}
			>
				<Icon name={player.playing ? "close" : "play"} size="xs" />
			</button>
			<div
				ref={player.barRef}
				onClick={player.seek}
				className="flex-1 h-2 bg-background rounded-full relative border border-border cursor-pointer min-w-0"
			>
				<div
					className="absolute inset-y-0 left-0 bg-skill-listening rounded-full transition-[width]"
					style={{ width: `${player.progress}%` }}
				/>
			</div>
			<span className="text-xs text-muted tabular-nums shrink-0">
				{formatAudioTime(player.currentTime)} / {formatAudioTime(player.duration)}
			</span>
			<audio ref={player.audioRef} src={src} preload="metadata" className="hidden" />
		</div>
	)
}
