import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useActivity, useProgress, useSpiderChart } from "@/hooks/use-progress"
import { useUser } from "@/hooks/use-user"
import { user as getAuthUser } from "@/lib/auth"
import { avatarUrl, getInitials } from "@/lib/avatar"

const LearningPathTab = lazy(() =>
	import("./-components/LearningPathTab").then((module) => ({ default: module.LearningPathTab })),
)
const OverviewTab = lazy(() =>
	import("./-components/OverviewTab").then((module) => ({ default: module.OverviewTab })),
)
const TestPracticeTab = lazy(() =>
	import("./-components/TestPracticeTab").then((module) => ({ default: module.TestPracticeTab })),
)

export const Route = createFileRoute("/_learner/progress/")({
	component: ProgressOverviewPage,
})

function ProgressOverviewPage() {
	const currentUser = getAuthUser()
	const { data: userData } = useUser(currentUser?.id ?? "")
	const spider = useSpiderChart()
	const progress = useProgress()
	const activity = useActivity(90)

	const isLoading = spider.isLoading || progress.isLoading || activity.isLoading
	const error = spider.error || progress.error || activity.error

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="mt-1 h-5 w-72" />
				</div>
				<Skeleton className="h-24 rounded-2xl" />
				<Skeleton className="h-10 rounded-lg" />
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-20 rounded-2xl" />
					))}
				</div>
				<Skeleton className="h-48 rounded-2xl" />
				<div className="grid gap-6 md:grid-cols-2">
					<Skeleton className="h-72 rounded-2xl" />
					<Skeleton className="h-72 rounded-2xl" />
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="rounded-2xl bg-muted/50 p-12 text-center">
				<p className="text-lg font-semibold">Đã xảy ra lỗi</p>
				<p className="mt-1 text-muted-foreground">{error.message}</p>
			</div>
		)
	}

	const spiderData = spider.data
	const progressData = progress.data
	const activityData = activity.data

	const initials = getInitials(currentUser?.fullName, currentUser?.email)
	const avatarSrc = avatarUrl(userData?.avatarKey, currentUser?.fullName)

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold">Tiến độ học tập</h1>
				<p className="mt-1 text-muted-foreground">Theo dõi quá trình học và đặt mục tiêu</p>
			</div>

			{/* Profile Card */}
			<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-8">
				<div className="relative z-10 flex items-center gap-5">
					<Avatar className="size-16 border-2 border-white/30 shadow-lg">
						<AvatarImage src={avatarSrc} alt={currentUser?.fullName ?? "Avatar"} />
						<AvatarFallback className="bg-white/20 text-lg font-bold text-white">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div>
						<h2 className="text-2xl font-bold text-white">Hi, {currentUser?.fullName ?? "Bạn"}</h2>
						<p className="mt-1 text-sm text-white/80">
							Hãy tiếp tục học mỗi ngày — nỗ lực của bạn sẽ được đền đáp!
						</p>
					</div>
				</div>
				<div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/5" />
				<div className="absolute -bottom-4 -right-4 size-20 rounded-full bg-white/5" />
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview">
				<TabsList className="w-full">
					<TabsTrigger value="overview">Tổng Quát</TabsTrigger>
					<TabsTrigger value="test-practice">Test Practice</TabsTrigger>
					<TabsTrigger value="learning-path">Lộ trình</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6 space-y-6">
					<Suspense fallback={<TabSectionSkeleton />}>
						<OverviewTab
							spiderData={spiderData}
							progressData={progressData}
							activityData={activityData}
						/>
					</Suspense>
				</TabsContent>

				<TabsContent value="test-practice" className="mt-6 space-y-6">
					<Suspense fallback={<TabSectionSkeleton />}>
						<TestPracticeTab spiderData={spiderData} progressData={progressData} />
					</Suspense>
				</TabsContent>

				<TabsContent value="learning-path" className="mt-6 space-y-6">
					<Suspense fallback={<TabSectionSkeleton />}>
						<LearningPathTab />
					</Suspense>
				</TabsContent>
			</Tabs>
		</div>
	)
}

function TabSectionSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-24 rounded-2xl" />
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-20 rounded-2xl" />
				))}
			</div>
			<Skeleton className="h-48 rounded-2xl" />
			<div className="grid gap-6 md:grid-cols-2">
				<Skeleton className="h-72 rounded-2xl" />
				<Skeleton className="h-72 rounded-2xl" />
			</div>
		</div>
	)
}
