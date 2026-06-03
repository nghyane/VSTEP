import { Link } from "@tanstack/react-router"

interface Props {
	mode: "register" | "login" | "authenticated"
	onLogout?: () => void
}

export function LandingMobileAppNotice({ mode, onLogout }: Props) {
	const title =
		mode === "authenticated"
			? "Vui lòng dùng app VSTEP trên điện thoại."
			: mode === "login"
				? "Đăng nhập trên điện thoại sẽ dùng app VSTEP."
				: "Đăng ký trên điện thoại sẽ dùng app VSTEP."
	const body =
		mode === "authenticated"
			? "Tài khoản learner đã đăng nhập. Để học trên điện thoại, vui lòng chuyển sang app VSTEP khi app mở public. Dùng máy tính để luyện thi đầy đủ trên web."
			: mode === "login"
				? "Hiện tại learner trên điện thoại sẽ đăng nhập qua app để có trải nghiệm ổn định hơn. Vui lòng dùng máy tính nếu muốn đăng nhập web ngay bây giờ."
				: "Phiên bản app đang chuẩn bị mở public. Vui lòng tải app khi có thông báo, hoặc dùng máy tính để đăng ký và luyện thi đầy đủ."

	return (
		<div className="fixed inset-0 z-50 flex items-end bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
			<div className="w-full rounded-t-[28px] border-2 border-b-0 border-border bg-surface px-6 pb-7 pt-6 shadow-2xl sm:mx-auto sm:max-w-md sm:rounded-(--radius-card) sm:border-b-4">
				<img
					src="/mascot/lac-wave.png"
					alt=""
					className="mx-auto mb-4 h-20 w-20 object-contain sm:h-24 sm:w-24"
				/>
				<p className="text-center text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
					Trải nghiệm mobile
				</p>
				<h2 className="mt-2 text-center font-sans text-2xl font-extrabold leading-tight text-foreground">
					{title}
				</h2>
				<p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted">{body}</p>

				<div className="mt-5 space-y-3">
					<button
						type="button"
						disabled
						className="btn btn-primary w-full cursor-not-allowed py-3.5 opacity-70"
					>
						Tải app — sắp ra mắt
					</button>
					{mode === "authenticated" ? (
						<button type="button" onClick={onLogout} className="btn btn-secondary w-full py-3 text-info">
							Đăng xuất
						</button>
					) : mode === "login" ? (
						<Link to="/" className="block py-1 text-center text-sm font-bold text-subtle">
							Quay lại trang chủ
						</Link>
					) : (
						<>
							<Link
								to="/"
								search={{ auth: "login" }}
								className="btn btn-secondary w-full py-3 text-center text-info"
							>
								Đã có tài khoản
							</Link>
							<Link to="/" className="block py-1 text-center text-sm font-bold text-subtle">
								Quay lại trang chủ
							</Link>
						</>
					)}
				</div>
			</div>
		</div>
	)
}
