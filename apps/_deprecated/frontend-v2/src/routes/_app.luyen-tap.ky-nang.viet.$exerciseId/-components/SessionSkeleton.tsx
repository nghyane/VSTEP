import { Skeleton } from "#/shared/ui/skeleton"

export function SessionSkeleton() {
	return (
		<div className="mt-4 space-y-6">
			<Skeleton className="h-16 w-3/4" />
			<Skeleton className="h-32 rounded-2xl" />
			<Skeleton className="h-96 rounded-2xl" />
		</div>
	)
}
