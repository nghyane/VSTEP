import { Link } from "@tanstack/react-router"

export function AuthChoose() {
	return (
		<>
			<h1 className="font-extrabold text-2xl text-foreground mb-10">Chào mừng đến VSTEP</h1>
			<div className="space-y-3">
				<Link to="/" search={{ auth: "register" }} className="btn btn-primary w-full h-12 text-base">
					Bắt đầu
				</Link>
				<Link
					to="/"
					search={{ auth: "login" }}
					className="btn btn-secondary text-primary w-full h-12 text-base"
				>
					Tôi đã có tài khoản
				</Link>
			</div>
		</>
	)
}
