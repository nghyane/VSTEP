// StickerAnchor — wrap target text/paragraph mà sticker trỏ vào.
// Supports both block (div) and inline (span) rendering.

interface Props {
	id: string
	children: React.ReactNode
	className?: string
	registerRef?: (id: string, el: HTMLElement | null) => void
}

export function StickerAnchor({ id, children, className, registerRef }: Props) {
	const isInline = className?.includes("inline")
	const Tag = isInline ? "span" : "div"
	return (
		<Tag
			ref={(el) => registerRef?.(id, el)}
			data-sticker-anchor={id}
			className={className}
		>
			{children}
		</Tag>
	)
}
