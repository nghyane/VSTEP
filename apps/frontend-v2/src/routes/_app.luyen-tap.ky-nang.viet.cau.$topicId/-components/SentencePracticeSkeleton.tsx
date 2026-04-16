import { Skeleton } from "#/components/ui/skeleton"

export function SentencePracticeSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-12 w-56" />
			<Skeleton className="h-2 w-full rounded-full" />
			<Skeleton className="h-[420px] rounded-2xl" />
		</div>
	)
}
