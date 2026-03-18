import { useState } from "react"
import { cn } from "@/lib/utils"
import type { WritingExam } from "@/routes/_learner/practice/-components/mock-data"
import { parseWritingPrompt } from "@/routes/_focused/-components/shared/exercise-shared"

export function WritingLevel1Layout({
	tasks,
	children,
}: {
	tasks: WritingExam["tasks"]
	children: React.ReactNode
}) {
	const [mobileTab, setMobileTab] = useState<"prompt" | "editor">("prompt")
	const task = tasks[0]
	if (!task) return <>{children}</>

	const { before, quote, after } = parseWritingPrompt(task.prompt)

	const promptPanel = (
		<div className="space-y-4">
			{task.title && (
				<span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
					{task.title}
				</span>
			)}

			<div className="whitespace-pre-line text-sm leading-relaxed">{before}</div>

			{quote && (
				<blockquote className="rounded-xl border-l-[3px] border-primary bg-muted/30 py-3 pr-4 pl-4 text-sm italic leading-relaxed">
					{quote}
				</blockquote>
			)}

			{after && <div className="whitespace-pre-line text-sm leading-relaxed">{after}</div>}

			{task.instructions && <p className="text-sm text-muted-foreground">{task.instructions}</p>}

			<p className="text-sm text-muted-foreground">Tối thiểu {task.wordLimit} từ</p>
		</div>
	)

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Desktop: split layout */}
			<div className="hidden flex-1 overflow-hidden lg:flex">
				<div className="w-2/5 overflow-y-auto border-r bg-muted/5 p-6">{promptPanel}</div>
				<div className="flex flex-1 flex-col overflow-hidden">{children}</div>
			</div>

			{/* Mobile: tabbed layout */}
			<div className="flex flex-1 flex-col overflow-hidden lg:hidden">
				<div className="flex shrink-0 border-b">
					<button
						type="button"
						onClick={() => setMobileTab("prompt")}
						className={cn(
							"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
							mobileTab === "prompt"
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Đề bài
					</button>
					<button
						type="button"
						onClick={() => setMobileTab("editor")}
						className={cn(
							"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
							mobileTab === "editor"
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Viết bài
					</button>
				</div>
				<div className="flex flex-1 flex-col overflow-hidden">
					{mobileTab === "prompt" ? (
						<div className="flex-1 overflow-y-auto p-4">{promptPanel}</div>
					) : (
						children
					)}
				</div>
			</div>
		</div>
	)
}
