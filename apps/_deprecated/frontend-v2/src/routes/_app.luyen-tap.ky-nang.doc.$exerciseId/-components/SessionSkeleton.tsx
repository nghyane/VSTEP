import { Skeleton } from "#/shared/ui/skeleton"

export function SessionSkeleton() {
	return (
		<div className="mt-4 space-y-6">
			<Skeleton className="h-16 w-3/4" />
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-96 rounded-2xl" />
				<Skeleton className="h-96 rounded-3xl" />
			</div>
		</div>
	)
}
