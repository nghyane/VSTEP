import { cn } from "#/lib/utils"

interface Props {
	className?: string
}

export function Skeleton({ className }: Props) {
	return <div className={cn("animate-pulse rounded-(--radius-input) bg-surface-muted", className)} />
}
