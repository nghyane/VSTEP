import { Skeleton } from "#/components/ui/skeleton"

export function SessionSkeleton() {
	return (
		<div className="mt-4 space-y-6">
			<Skeleton className="h-16 w-3/4" />
			<Skeleton className="h-28 rounded-2xl" />
			<Skeleton className="h-60 rounded-2xl" />
		</div>
	)
}
