// WritingSupportPanel — keywords + sentence starters. Click starter để insert vào editor.

import { Plus, Tag, Type } from "lucide-react"
import { ChatGptIcon } from "#/components/common/ChatGptIcon"

interface Props {
	keywords: readonly string[]
	starters: readonly string[]
	onInsertStarter: (template: string) => void
}

export function WritingSupportPanel({ keywords, starters, onInsertStarter }: Props) {
	return (
		<div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
			<div className="flex items-center gap-3 px-5 py-4">
				<ChatGptIcon className="size-5 shrink-0 text-primary" />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-foreground">Trợ lý AI</p>
					<p className="text-xs text-muted-foreground">
						Từ khóa nên dùng và câu mẫu click để chèn vào bài
					</p>
				</div>
			</div>

			<div className="space-y-4 px-5 pb-5">
				<section>
					<SectionLabel icon={Tag} label={`Từ khóa nên dùng (${keywords.length})`} />
					<ul className="mt-2 flex flex-wrap gap-1.5">
						{keywords.map((kw) => (
							<li
								key={kw}
								className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm"
							>
								{kw}
							</li>
						))}
					</ul>
				</section>

				<section>
					<SectionLabel icon={Type} label="Câu mẫu (click để chèn)" />
					<ul className="mt-2 flex flex-col gap-1.5">
						{starters.map((s) => (
							<li key={s}>
								<button
									type="button"
									onClick={() => onInsertStarter(s)}
									className="group flex w-full items-center gap-2 rounded-lg border border-primary/10 bg-background px-3 py-2 text-left text-xs text-foreground/90 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
								>
									<Plus className="size-3 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
									<span className="truncate">{s}</span>
								</button>
							</li>
						))}
					</ul>
				</section>
			</div>
		</div>
	)
}

function SectionLabel({ icon: Icon, label }: { icon: typeof Tag; label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
			<Icon className="size-3" />
			{label}
		</span>
	)
}
