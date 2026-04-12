// NextActionCard — 1 CTA lớn duy nhất trong Focus tab. "Làm gì tiếp theo?"

import { Link } from "@tanstack/react-router"
import { ArrowRight, BookType, Clock, Languages, type LucideIcon, Target } from "lucide-react"
import type { NextAction, NextActionCategory } from "#/lib/mock/overview"

interface Props {
	action: NextAction
}

const CATEGORY_META: Record<NextActionCategory, { icon: LucideIcon; label: string }> = {
	vocabulary: { icon: Languages, label: "Từ vựng" },
	grammar: { icon: BookType, label: "Ngữ pháp" },
	test: { icon: Target, label: "Thi thử" },
}

export function NextActionCard({ action }: Props) {
	const meta = CATEGORY_META[action.category]
	const Icon = meta.icon

	return (
		<Link
			to={action.targetUrl}
			className="group mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-3xl border bg-card p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
				<Icon className="size-4" />
				<span>{meta.label} · Tiếp theo</span>
			</div>

			<div className="space-y-2">
				<h2 className="text-2xl font-bold leading-tight md:text-3xl">{action.title}</h2>
				<p className="text-sm text-muted-foreground md:text-base">{action.subtitle}</p>
			</div>

			<div className="flex items-center justify-between border-t pt-5">
				<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<Clock className="size-4" />
					Ước tính {action.estimateMinutes} phút
				</span>
				<span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
					Bắt đầu
					<ArrowRight className="size-4" />
				</span>
			</div>
		</Link>
	)
}
