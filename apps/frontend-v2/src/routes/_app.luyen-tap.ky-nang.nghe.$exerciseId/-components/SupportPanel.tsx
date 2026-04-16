// SupportPanel — Chế độ hỗ trợ: keywords luôn hiển thị, transcript ẩn behind toggle.

import { ChevronDown, FileText, Lightbulb, Tag } from "lucide-react"
import { useState } from "react"
import { cn } from "#/lib/utils"

interface Props {
	transcript: string
	keywords: readonly string[]
}

export function SupportPanel({ transcript, keywords }: Props) {
	const [transcriptOpen, setTranscriptOpen] = useState(false)

	return (
		<div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
			<PanelHeader />

			<div className="space-y-4 px-5 pb-5">
				<KeywordsSection keywords={keywords} />
				<TranscriptSection
					transcript={transcript}
					open={transcriptOpen}
					onToggle={() => setTranscriptOpen((v) => !v)}
				/>
			</div>
		</div>
	)
}

// ─── Sub-sections ──────────────────────────────────────────────────

function PanelHeader() {
	return (
		<div className="flex items-center gap-3 px-5 py-4">
			<Lightbulb className="size-5 shrink-0 text-primary" />
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-foreground">Chế độ hỗ trợ</p>
				<p className="text-xs text-muted-foreground">
					Từ khóa gợi ý và bản ghi bài nghe để bạn tham khảo
				</p>
			</div>
		</div>
	)
}

function KeywordsSection({ keywords }: { keywords: readonly string[] }) {
	return (
		<div>
			<SectionLabel icon={Tag} label={`Từ khóa chính (${keywords.length})`} />
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
		</div>
	)
}

function TranscriptSection({
	transcript,
	open,
	onToggle,
}: {
	transcript: string
	open: boolean
	onToggle: () => void
}) {
	return (
		<div>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={open}
				className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:text-primary"
			>
				<SectionLabel icon={FileText} label="Nội dung bài nghe" />
				<ChevronDown
					className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
				/>
			</button>
			{open && (
				<p className="mt-2 rounded-xl bg-background p-4 text-sm leading-relaxed text-foreground/90 shadow-sm">
					{transcript}
				</p>
			)}
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
