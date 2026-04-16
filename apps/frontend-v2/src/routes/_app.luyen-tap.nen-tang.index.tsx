import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, ArrowRight, BookType, Languages, type LucideIcon } from "lucide-react"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/")({
	component: NenTangHubPage,
})

interface SubModuleCardProps {
	icon: LucideIcon
	title: string
	description: string
	to: "/luyen-tap/nen-tang/tu-vung" | "/luyen-tap/nen-tang/ngu-phap"
	search: { view: "level" }
	cta: string
}

function NenTangHubPage() {
	return (
		<div className="mx-auto w-full max-w-5xl">
			<Link
				to="/luyen-tap"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Chọn chế độ luyện tập
			</Link>
			<div className="mt-4 text-center">
				<h1 className="text-3xl font-bold tracking-tight md:text-4xl">Luyện tập nền tảng</h1>
				<p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
					Học từ vựng và ngữ pháp có hệ thống — nền móng cho cả bốn kỹ năng VSTEP.
				</p>
			</div>
			<div className="mt-10 grid items-stretch gap-6 md:grid-cols-2">
				<SubModuleCard
					icon={Languages}
					title="Luyện từ vựng"
					description="Học từ theo chủ đề với hệ thống lặp lại cách quãng (SRS) kiểu Anki — từ nào khó sẽ lặp lại sớm, từ nào dễ lặp lại thưa dần."
					to="/luyen-tap/nen-tang/tu-vung"
					search={{ view: "level" } as const}
					cta="Bắt đầu học từ vựng"
				/>
				<SubModuleCard
					icon={BookType}
					title="Luyện ngữ pháp"
					description="Học lý thuyết ngữ pháp có cấu trúc cùng bộ câu mẫu, rồi luyện bằng bài tập trắc nghiệm có giải thích."
					to="/luyen-tap/nen-tang/ngu-phap"
					search={{ view: "level" } as const}
					cta="Bắt đầu học ngữ pháp"
				/>
			</div>
		</div>
	)
}

function SubModuleCard({ icon: Icon, title, description, to, search, cta }: SubModuleCardProps) {
	return (
		<Link
			to={to}
			search={search}
			className={cn(
				"group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition",
				"cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
			)}
		>
			<div className="px-8 pt-8 pb-6">
				<div className="flex items-center gap-4">
					<Icon className="size-10 shrink-0 text-primary" />
					<div className="min-w-0">
						<h2 className="truncate text-xl font-bold">{title}</h2>
					</div>
				</div>
				<p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
			</div>
			<div className="mt-auto px-8 pt-6 pb-8">
				<div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
					{cta}
					<ArrowRight className="size-4" />
				</div>
			</div>
		</Link>
	)
}
