import { Link } from "@tanstack/react-router"

export function LandingCTA() {
	return (
		<section className="py-20">
			<div className="max-w-[1140px] mx-auto px-8">
				<div className="card bg-primary-tint border-primary/20 p-10 lg:p-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
					<img
						src="/mascot/lac-happy.png"
						alt=""
						className="w-32 h-32 lg:w-44 lg:h-44 object-contain shrink-0"
					/>
					<div className="flex-1 text-center lg:text-left">
						<h2 className="font-sans font-extrabold text-3xl md:text-4xl text-foreground leading-tight tracking-tight">
							Mở khóa buổi luyện đầu tiên cùng Lạc.
						</h2>
						<p className="text-muted text-base mt-3 leading-relaxed max-w-lg mx-auto lg:mx-0">
							Nhận 100 xu để thử chấm AI, làm đề mẫu và xem lộ trình ôn VSTEP phù hợp với mục tiêu của bạn.
						</p>
						<div className="flex flex-wrap gap-2 mt-5 justify-center lg:justify-start">
							<span className="rounded-full bg-surface px-3 py-1.5 text-xs font-extrabold text-primary-dark border border-primary/20">
								100 xu miễn phí
							</span>
							<span className="rounded-full bg-surface px-3 py-1.5 text-xs font-extrabold text-primary-dark border border-primary/20">
								AI review bài viết
							</span>
							<span className="rounded-full bg-surface px-3 py-1.5 text-xs font-extrabold text-primary-dark border border-primary/20">
								Đề mẫu đầu tiên
							</span>
						</div>
					</div>
					<Link
						to="/"
						search={{ auth: "register" }}
						className="btn btn-primary text-base px-10 py-3.5 shrink-0"
					>
						Nhận 100 xu
					</Link>
				</div>
			</div>
		</section>
	)
}
