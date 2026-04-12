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
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--background)",
					"--normal-text": "var(--foreground)",
					"--normal-border": "transparent",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			toastOptions={{ classNames: { toast: "border-0 shadow-lg" } }}
			{...props}
		/>
	)
}

export { Toaster }
