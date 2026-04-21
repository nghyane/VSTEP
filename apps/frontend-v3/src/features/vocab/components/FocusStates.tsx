import { Link } from "@tanstack/react-router"
import type { BackLink } from "#/features/vocab/types"

interface CompleteProps extends BackLink {
	total: number
	message: string
}

export function FocusComplete({ backTo, backParams, message }: CompleteProps) {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-6">
			<div className="text-center">
				<img src="/mascot/lac-happy.png" alt="" className="w-36 h-36 mx-auto mb-6 object-contain" />
				<h2 className="font-extrabold text-2xl text-foreground mb-2">Hoàn thành!</h2>
				<p className="text-muted mb-6">{message}</p>
				<Link to={backTo} params={backParams} className="btn btn-primary px-8 py-3 text-base">
					Quay lại
				</Link>
			</div>
		</div>
	)
}

interface EmptyProps extends BackLink {
	title: string
	message: string
}

export function FocusEmpty({ backTo, backParams, title, message }: EmptyProps) {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-6">
			<div className="text-center">
				<img src="/mascot/lac-think.png" alt="" className="w-32 h-32 mx-auto mb-6 object-contain" />
				<h2 className="font-extrabold text-xl text-foreground mb-2">{title}</h2>
				<p className="text-muted mb-6">{message}</p>
				<Link to={backTo} params={backParams} className="btn btn-primary px-8 py-3 text-base">
					Quay lại
				</Link>
			</div>
		</div>
	)
}
