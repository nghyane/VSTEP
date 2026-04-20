import { useToast } from "#/lib/toast-store"

export function Toaster() {
	const toasts = useToast((s) => s.toasts)
	const remove = useToast((s) => s.remove)

	if (!toasts.length) return null

	return (
		<div className="fixed top-6 right-6 z-[100] flex flex-col gap-2">
			{toasts.map((t) => (
				<button
					key={t.id}
					type="button"
					onClick={() => remove(t.id)}
					className="card flex items-center px-5 py-3 animate-[slideIn_0.2s_ease-out]"
				>
					<span className={`text-sm font-bold ${t.type === "error" ? "text-destructive" : "text-primary-dark"}`}>
						{t.message}
					</span>
				</button>
			))}
		</div>
	)
}
