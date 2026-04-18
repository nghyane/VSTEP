import { cn } from "#/lib/utils"

// Icons8 icon từ link user chọn: https://icons8.com/icon/8O7kATLLDxiR/voice
// Dùng PNG tĩnh khi idle + GIF khi đang phát để chỉ animate lúc speaking.
const SPEAKER_STATIC_SRC = "https://img.icons8.com/glyph-neue/100/medium-volume--v2.png"
const SPEAKER_ANIMATED_SRC = "https://img.icons8.com/glyph-neue/100/medium-volume--v2.gif"

interface SpeakerIconProps {
	className?: string
	alt?: string
	active?: boolean
}

export function SpeakerIcon({ className, alt = "", active = false }: SpeakerIconProps) {
	return (
		<img
			src={active ? SPEAKER_ANIMATED_SRC : SPEAKER_STATIC_SRC}
			alt={alt}
			className={cn("object-contain mix-blend-multiply dark:mix-blend-screen", className)}
		/>
	)
}
