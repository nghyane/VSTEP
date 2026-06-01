import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
	return (
		<Sonner
			className="toaster group"
			icons={{
				success: <CircleCheckIcon className="size-5 text-emerald-600" />,
				info: <InfoIcon className="size-5 text-sky-600" />,
				warning: <TriangleAlertIcon className="size-5 text-amber-500" />,
				error: <OctagonXIcon className="size-5 text-rose-600" />,
				loading: <Loader2Icon className="size-5 animate-spin text-primary" />,
			}}
			style={
				{
					"--normal-bg": "var(--card)",
					"--normal-text": "var(--card-foreground)",
					"--normal-border": "var(--border)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					// Base: rounded-2xl + border dày dưới (hiệu ứng 3D gamification kiểu Duolingo)
					toast: "!rounded-2xl !border-2 !border-b-4 !shadow-lg !font-medium !w-fit !max-w-sm",
					title: "!font-bold",
					description: "!text-xs !opacity-75",
					success:
						"!border-emerald-300 !border-b-emerald-500 !bg-emerald-50 !text-emerald-900 dark:!border-emerald-700 dark:!border-b-emerald-500 dark:!bg-emerald-950/80 dark:!text-emerald-100",
					info: "!border-sky-300 !border-b-sky-500 !bg-sky-50 !text-sky-900 dark:!border-sky-700 dark:!border-b-sky-500 dark:!bg-sky-950/80 dark:!text-sky-100",
					warning:
						"!border-amber-300 !border-b-amber-500 !bg-amber-50 !text-amber-900 dark:!border-amber-700 dark:!border-b-amber-500 dark:!bg-amber-950/80 dark:!text-amber-100",
					error:
						"!border-rose-300 !border-b-rose-500 !bg-rose-50 !text-rose-900 dark:!border-rose-700 dark:!border-b-rose-500 dark:!bg-rose-950/80 dark:!text-rose-100",
				},
			}}
			{...props}
		/>
	)
}

export { Toaster }
