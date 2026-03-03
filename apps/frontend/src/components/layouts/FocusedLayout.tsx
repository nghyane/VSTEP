import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Cancel01Icon,
	Clock01Icon,
	Menu02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, Outlet } from "@tanstack/react-router"
import { useState } from "react"
import { Logo } from "@/components/common/Logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const MOCK_TOTAL: number = 35
const MOCK_CURRENT: number = 5
const MOCK_ANSWERED: number[] = [1, 2, 3, 4]

function QuestionGrid() {
	return (
		<>
			<div className="grid grid-cols-5 gap-1.5">
				{Array.from({ length: MOCK_TOTAL }, (_, i) => {
					const num = i + 1
					const isAnswered = MOCK_ANSWERED.includes(num)
					const isCurrent = num === MOCK_CURRENT
					return (
						<button
							key={num}
							type="button"
							className={cn(
								"flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
								isCurrent && "bg-primary text-primary-foreground",
								!isCurrent && isAnswered && "bg-primary/10 text-primary",
								!isCurrent && !isAnswered && "bg-background text-muted-foreground hover:bg-accent",
							)}
						>
							{num}
						</button>
					)
				})}
			</div>
			<div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
				<div className="flex items-center gap-2">
					<span className="size-3 rounded bg-primary" />
					Câu hiện tại
				</div>
				<div className="flex items-center gap-2">
					<span className="size-3 rounded bg-primary/10" />
					Đã trả lời
				</div>
				<div className="flex items-center gap-2">
					<span className="size-3 rounded border border-border bg-background" />
					Chưa trả lời
				</div>
			</div>
		</>
	)
}

export function FocusedLayout() {
	const [sheetOpen, setSheetOpen] = useState(false)
	const answeredCount = MOCK_ANSWERED.length

	return (
		<div className="flex h-screen flex-col bg-background">
			{/* Header */}
			<header className="z-40 border-b bg-background">
				<div className="flex h-14 items-center justify-between gap-2 px-4">
					<div className="flex items-center gap-3">
						<Logo size="sm" />
						<Badge variant="secondary" className="hidden sm:inline-flex">
							Listening
						</Badge>
					</div>

					<div className="flex items-center gap-2 sm:gap-3">
						<div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
							<HugeiconsIcon icon={Clock01Icon} className="size-4 text-primary" />
							<span className="text-sm font-semibold tabular-nums">39:45</span>
						</div>
						<span className="hidden text-sm text-muted-foreground sm:inline">
							{answeredCount}/{MOCK_TOTAL} đã trả lời
						</span>
					</div>

					<div className="flex items-center gap-1">
						{/* Mobile question nav trigger */}
						<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className="lg:hidden">
									<HugeiconsIcon icon={Menu02Icon} className="size-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-72">
								<SheetHeader>
									<SheetTitle>Danh sách câu hỏi</SheetTitle>
								</SheetHeader>
								<div className="px-4 pt-2">
									<QuestionGrid />
								</div>
							</SheetContent>
						</Sheet>
						<Button variant="ghost" size="sm" asChild>
							<Link to="/">
								<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
								<span className="hidden sm:inline">Thoát</span>
							</Link>
						</Button>
					</div>
				</div>
			</header>

			{/* Body */}
			<div className="flex flex-1 overflow-hidden">
				<main className="flex-1 overflow-y-auto">
					<div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
						<Outlet />
					</div>
				</main>

				{/* Desktop sidebar */}
				<aside className="hidden w-64 flex-col border-l bg-muted/30 lg:flex">
					<div className="p-4">
						<p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
							Danh sách câu hỏi
						</p>
					</div>
					<ScrollArea className="flex-1 px-4">
						<QuestionGrid />
					</ScrollArea>
					<div className="border-t p-4">
						<p className="text-xs text-muted-foreground">
							{answeredCount}/{MOCK_TOTAL} đã trả lời
						</p>
					</div>
				</aside>
			</div>

			{/* Footer */}
			<footer className="z-40 border-t bg-background">
				<div className="flex h-14 items-center justify-between px-4">
					<Button variant="outline" size="sm" disabled={MOCK_CURRENT === 1}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						<span className="hidden sm:inline">Câu trước</span>
					</Button>
					<span className="text-sm font-medium">
						Câu {MOCK_CURRENT}/{MOCK_TOTAL}
					</span>
					<Button variant="outline" size="sm" disabled={MOCK_CURRENT === MOCK_TOTAL}>
						<span className="hidden sm:inline">Câu tiếp</span>
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				</div>
			</footer>
		</div>
	)
}
