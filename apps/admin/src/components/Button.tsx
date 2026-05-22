import { Button as AntdButton, type ButtonProps as AntdButtonProps } from "antd"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant
	size?: Size
	loading?: boolean
	icon?: ReactNode
}

const typeMap: Record<Variant, AntdButtonProps["type"]> = {
	primary: "primary",
	secondary: "default",
	ghost: "text",
	danger: "primary",
}

const sizeMap: Record<Size, AntdButtonProps["size"]> = {
	sm: "small",
	md: "middle",
	lg: "large",
}

export function Button({
	variant = "primary",
	size = "md",
	loading,
	icon,
	className,
	children,
	disabled,
	onClick,
	type,
}: Props) {
	return (
		<AntdButton
			type={typeMap[variant]}
			danger={variant === "danger"}
			size={sizeMap[size]}
			loading={loading}
			icon={icon}
			disabled={disabled}
			className={className}
			onClick={onClick as AntdButtonProps["onClick"]}
			htmlType={type ?? "button"}
		>
			{children}
		</AntdButton>
	)
}
