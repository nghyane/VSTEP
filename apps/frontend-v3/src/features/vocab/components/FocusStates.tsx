import { Link } from "@tanstack/react-router"

interface Props {
	total: number
	backTo: string
	backParams?: Record<string, string>
	mascot?: string
	title?: string
	message?: string
}

export function FocusComplete({ total, backTo, backParams, mascot = "/mascot/lac-happy.png", title = "Hoàn thành!", message }: Props) {
	return (
		<div className="text-center">
			<img src={mascot} alt="" className="w-32 h-32 mx-auto mb-4 object-contain" />
			<h2 className="font-extrabold text-2xl text-foreground mb-2">{title}</h2>
			<p className="text-muted mb-6">{message ?? `Bạn đã hoàn thành ${total} mục.`}</p>
			<Link to={backTo} params={backParams} className="btn btn-primary px-8 py-3 text-base">
				Quay lại
			</Link>
		</div>
	)
}

export function FocusEmpty({ backTo, backParams, title, message }: Omit<Props, "total">) {
	return (
		<div className="text-center">
			<img src="/mascot/lac-think.png" alt="" className="w-28 h-28 mx-auto mb-4 object-contain" />
			<h2 className="font-extrabold text-xl text-foreground mb-2">{title ?? "Chưa có nội dung"}</h2>
			<p className="text-muted mb-6">{message}</p>
			<Link to={backTo} params={backParams} className="btn btn-primary px-8 py-3 text-base">
				Quay lại
			</Link>
		</div>
	)
}
