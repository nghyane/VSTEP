// KeywordsPills — hiện keywords dạng pills nhỏ gọn, dùng chung cho Nghe/Đọc.

import { Tag } from "lucide-react"

export function KeywordsPills({ keywords }: { keywords: readonly string[] }) {
	if (keywords.length === 0) return null
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				<Tag className="size-3" />
				Từ khóa
			</span>
			{keywords.map((kw) => (
				<span
					key={kw}
					className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground"
				>
					{kw}
				</span>
			))}
		</div>
	)
}
