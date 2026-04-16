// ComingSoon — placeholder cho các route chưa implement. Dùng cho Phase 2+.

import { Link } from "@tanstack/react-router"
import { ArrowLeft, Construction } from "lucide-react"

interface Props {
	backTo: "/luyen-tap/ky-nang" | "/luyen-tap/nen-tang" | "/luyen-tap"
	backLabel: string
	title: string
	description?: string
}

export function ComingSoon({ backTo, backLabel, title, description }: Props) {
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Link
				to={backTo}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				{backLabel}
			</Link>
			<div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border bg-card p-16 text-center shadow-sm">
				<Construction className="size-12 text-primary" />
				<h1 className="text-2xl font-bold">{title}</h1>
				<p className="max-w-md text-sm text-muted-foreground">
					{description ?? "Tính năng này đang được phát triển và sẽ sớm có mặt."}
				</p>
			</div>
		</div>
	)
}
