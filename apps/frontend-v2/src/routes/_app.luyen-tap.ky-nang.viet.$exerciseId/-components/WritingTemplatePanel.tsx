// WritingTemplatePanel — placeholder cho support level "template" (điền vào mẫu).
// Đang phát triển: sẽ render template chia section với inline blanks + popover gợi ý.

import { Lightbulb } from "lucide-react"

export function WritingTemplatePanel() {
	return (
		<div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
			<div className="flex items-center gap-3 px-5 py-4">
				<Lightbulb className="size-5 shrink-0 text-primary" />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-foreground">Chế độ hỗ trợ · Điền vào mẫu</p>
					<p className="text-xs text-muted-foreground">
						Bạn sẽ thấy khung bài có sẵn các chỗ trống, click để xem gợi ý và chọn cụm phù hợp.
					</p>
				</div>
			</div>
			<div className="px-5 pb-5">
				<div className="rounded-lg border border-dashed border-primary/30 bg-background px-4 py-6 text-center">
					<p className="text-sm font-medium">Tính năng đang phát triển</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Trong lúc chờ, bạn có thể chuyển sang chế độ “Dàn ý + bài mẫu” hoặc “Gợi ý”.
					</p>
				</div>
			</div>
		</div>
	)
}
