// WritingSupportPanel — panel cấp "Gợi ý". Đặt ở cột phải, sticky.
// Gồm: keywords tham khảo + từ nối theo chức năng + sentence starters click-to-copy.

import { Copy, Lightbulb } from "lucide-react"
import { toast } from "sonner"
import { WRITING_LINKERS } from "#/lib/practice/writing-linkers"

interface Props {
	keywords: readonly string[]
	starters: readonly string[]
}

export function WritingSupportPanel({ keywords, starters }: Props) {
	return (
		<div className="space-y-5">
			<PanelHeader
				title="Gợi ý"
				subtitle="Tham khảo từ khóa, từ nối và câu mẫu. Click câu mẫu để copy."
			/>

			<Section label={`Từ khóa nên dùng (${keywords.length})`}>
				<ul className="flex flex-wrap gap-1.5">
					{keywords.map((kw) => (
						<li
							key={kw}
							className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-xs font-medium text-foreground"
						>
							{kw}
						</li>
					))}
				</ul>
			</Section>

			<Section label="Từ nối theo chức năng">
				<div className="space-y-3">
					{WRITING_LINKERS.map((group) => (
						<div key={group.label}>
							<p className="text-[11px] font-medium text-muted-foreground">{group.label}</p>
							<ul className="mt-1 flex flex-wrap gap-1">
								{group.phrases.map((p) => (
									<li key={p}>
										<CopyChip text={p} />
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</Section>

			<Section label="Câu mẫu (click để copy)">
				<ul className="flex flex-col gap-1">
					{starters.map((s) => (
						<li key={s}>
							<CopyRow text={s} />
						</li>
					))}
				</ul>
			</Section>
		</div>
	)
}

export function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
	return (
		<div className="flex items-start gap-2">
			<Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
			<div className="min-w-0">
				<p className="text-sm font-semibold">{title}</p>
				<p className="text-xs text-muted-foreground">{subtitle}</p>
			</div>
		</div>
	)
}

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<section>
			<p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
				{label}
			</p>
			{children}
		</section>
	)
}

function CopyChip({ text }: { text: string }) {
	return (
		<button
			type="button"
			onClick={() => copy(text)}
			className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
		>
			{text}
		</button>
	)
}

function CopyRow({ text }: { text: string }) {
	return (
		<button
			type="button"
			onClick={() => copy(text)}
			className="group flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-left text-xs text-foreground/90 transition-colors hover:bg-muted"
		>
			<Copy className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
			<span className="truncate">{text}</span>
		</button>
	)
}

function copy(text: string) {
	if (typeof navigator !== "undefined" && navigator.clipboard) {
		void navigator.clipboard.writeText(text)
		toast.success("Đã copy vào clipboard")
	}
}
