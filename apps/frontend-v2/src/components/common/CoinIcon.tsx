interface CoinIconProps {
	size?: number
	className?: string
}

export function CoinIcon({ size = 14, className }: CoinIconProps) {
	return (
		<img
			src="/image.png"
			alt=""
			aria-hidden="true"
			width={size}
			height={size}
			className={className}
			style={{ display: "block", flexShrink: 0 }}
		/>
	)
}
