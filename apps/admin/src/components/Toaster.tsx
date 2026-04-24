import { Toaster as SonnerToaster, toast } from "sonner"

export function Toaster() {
	return (
		<SonnerToaster
			position="top-right"
			duration={4000}
			classNames={{
				toast: "rounded-lg border border-border bg-surface shadow-lg",
				title: "text-sm font-medium text-foreground",
				description: "text-xs text-muted",
				success: "border-success",
				error: "border-danger",
			}}
		/>
	)
}

export function showSuccess(message: string, description?: string) {
	toast.success(message, { description })
}

export function showError(message: string, description?: string) {
	toast.error(message, { description })
}

export function showInfo(message: string, description?: string) {
	toast.info(message, { description })
}
