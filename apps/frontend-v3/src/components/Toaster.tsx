import type { Toast } from "#/lib/toast"
import { useToast } from "#/lib/toast"
import { cn } from "#/lib/utils"

const VARIANT: Record<
	Toast["type"],
	{ wrap: string; iconWrap: string; iconPath: React.ReactNode; text: string }
> = {
	success: {
		wrap: "border-primary/40 border-b-primary/70",
		iconWrap: "bg-primary text-white",
		text: "text-primary-dark",
		iconPath: (
			<path
				d="M4 8.5L7 11.5L12.5 5.5"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	},
	error: {
		wrap: "border-destructive/40 border-b-destructive/70",
		iconWrap: "bg-destructive text-white",
		text: "text-destructive",
		iconPath: (
			<path
				d="M5 5l6 6M11 5l-6 6"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	},
	warning: {
		wrap: "border-warning/40 border-b-warning/70",
		iconWrap: "bg-warning text-white",
		text: "text-warning",
		iconPath: (
			<path
				d="M8 4.5v4M8 11.5v.01"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	},
	info: {
		wrap: "border-skill-listening/40 border-b-skill-listening/70",
		iconWrap: "bg-skill-listening text-white",
		text: "text-skill-listening-dark",
		iconPath: (
			<path
				d="M8 7.5v4M8 4.5v.01"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		),
	},
}

export function Toaster() {
	const toasts = useToast((s) => s.toasts)
	const remove = useToast((s) => s.remove)

	if (!toasts.length) return null

	return (
		<div className="fixed top-6 right-6 z-[100] flex flex-col gap-2.5">
			{toasts.map((t) => {
				const v = VARIANT[t.type] ?? VARIANT.success
				return (
					<button
						key={t.id}
						type="button"
						onClick={() => remove(t.id)}
						className={cn(
							"flex items-center gap-3 rounded-(--radius-card) border-2 border-b-4 bg-card px-4 py-3 text-left shadow-[0_4px_12px_rgb(0_0_0_/_0.08)] transition-all active:translate-y-[2px] active:border-b-2 animate-[slideIn_0.2s_ease-out]",
							v.wrap,
						)}
					>
						<span
							className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", v.iconWrap)}
							aria-hidden="true"
						>
							<svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
								<title>{t.type}</title>
								{v.iconPath}
							</svg>
						</span>
						<span className={cn("text-sm font-extrabold", v.text)}>{t.message}</span>
					</button>
				)
			})}
		</div>
	)
}
