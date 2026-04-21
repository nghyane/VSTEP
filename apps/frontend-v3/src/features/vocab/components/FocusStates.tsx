import { Link } from "@tanstack/react-router"
import type { BackLink } from "#/features/vocab/types"

interface CompleteProps extends BackLink {
	total: number
	message: string
}

export function FocusComplete({ backTo, backParams, total, message }: CompleteProps) {
	return (
		<div className="text-center">
			<img src="/mascot/lac-happy.png" alt="" className="w-32 h-32 mx-auto mb-4 object-contain" />
			<h2 className="font-extrabold text-2xl text-foreground mb-2">Hoàn thành!</h2>
			<p className="text-muted mb-6">{message}</p>
			<Link to={backTo} params={backParams} className="btn btn-primary px-8 py-3 text-base">
				Quay lại
			</Link>
		</div>
	)
}

interface EmptyProps extends BackLink {
	title: string
	message: string
}

export function FocusEmpty({ backTo, backParams, title, message }: EmptyProps) {
	return (
		<div className="text-center">
			<img src="/mascot/lac-think.png" alt="" className="w-28 h-28 mx-auto mb-4 object-contain" />
			<h2 className="font-extrabold text-xl text-foreground mb-2">{title}</h2>
			<p className="text-muted mb-6">{message}</p>
			<Link to={backTo} params={backParams} className="btn btn-primary px-8 py-3 text-base">
				Quay lại
			</Link>
		</div>
	)
}
