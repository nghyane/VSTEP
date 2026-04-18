import { cn } from "#/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "#/shared/ui/avatar"
import { AnimSection, SectionHeading } from "../lib/shared"

const TESTIMONIALS = [
	{
		name: "Minh Anh",
		role: "Sinh viên ĐH Bách Khoa",
		quote:
			"Mình từ B1 lên B2 sau 2 tháng luyện tập. AI chấm Writing rất chi tiết, chỉ ra đúng lỗi cần sửa.",
		badge: "B1 → B2",
		avatar: "https://i.pravatar.cc/150?img=32",
		initials: "MA",
		stars: 5,
	},
	{
		name: "Thanh Hà",
		role: "Nhân viên văn phòng",
		quote:
			"Giao diện dễ dùng, luyện 15 phút mỗi ngày trên điện thoại. Tiết kiệm thời gian hơn đi học trung tâm.",
		badge: "B2 → C1",
		avatar: "https://i.pravatar.cc/150?img=47",
		initials: "TH",
		stars: 5,
	},
	{
		name: "Đức Huy",
		role: "Giảng viên tiếng Anh",
		quote:
			"Đề thi sát chuẩn VSTEP, phù hợp để giới thiệu cho sinh viên luyện tập thêm ngoài giờ học.",
		badge: "Đề xuất cho SV",
		avatar: "https://i.pravatar.cc/150?img=11",
		initials: "ĐH",
		stars: 4,
	},
] as const

export function TestimonialsSection() {
	return (
		<section className="py-20">
			<div className="mx-auto w-full max-w-6xl px-6">
				<AnimSection>
					<SectionHeading
						title="Học viên nói gì?"
						subtitle="Hàng nghìn người đã cải thiện điểm VSTEP"
					/>
				</AnimSection>
				<div className="mt-12 grid gap-6 md:grid-cols-3">
					{TESTIMONIALS.map((item, i) => (
						<AnimSection key={item.name} delay={i * 120}>
							<div className="rounded-2xl bg-card p-6 shadow-sm">
								<div className="mb-4 text-primary/20">
									<svg
										aria-hidden="true"
										className="size-8"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
									</svg>
								</div>
								<p className="text-sm leading-relaxed text-foreground">{item.quote}</p>
								<div className="my-4 h-px bg-border" />
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={item.avatar} alt={item.name} />
											<AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
												{item.initials}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="text-sm font-semibold">{item.name}</p>
											<p className="text-xs text-muted-foreground">{item.role}</p>
										</div>
									</div>
									<span className="rounded-lg bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
										{item.badge}
									</span>
								</div>
								<div className="mt-3 flex gap-0.5">
									{Array.from({ length: 5 }).map((_, si) => (
										<svg
											aria-hidden="true"
											key={si}
											className={cn(
												"size-4",
												si < item.stars ? "text-warning" : "text-muted-foreground/25",
											)}
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									))}
								</div>
							</div>
						</AnimSection>
					))}
				</div>
			</div>
		</section>
	)
}
