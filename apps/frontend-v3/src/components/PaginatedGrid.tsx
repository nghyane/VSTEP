import type { ReactNode } from "react"
import { cn } from "#/lib/utils"

interface Props {
	children: ReactNode
	itemCount: number
	pageSize: number
	hasPagination: boolean
	className?: string
	placeholderClassName?: string
}

export function PaginatedGrid({
	children,
	itemCount,
	pageSize,
	hasPagination,
	className,
	placeholderClassName,
}: Props) {
	const placeholderCount = hasPagination ? Math.max(0, pageSize - itemCount) : 0

	return (
		<div className={cn("grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
			{children}
			{Array.from({ length: placeholderCount }, (_, index) => (
				<div
					key={`pagination-placeholder-${index}`}
					aria-hidden="true"
					className={cn("invisible min-h-44 pointer-events-none", placeholderClassName)}
				/>
			))}
		</div>
	)
}
