import { useState } from "react"

interface FaqItem {
	question: string
	answer: string
}

const FAQS: FaqItem[] = [
	{
		question: "VSTEP có miễn phí không?",
		answer:
			"Đăng ký miễn phí, được tặng 100 xu. Đề thi cơ bản và luyện kỹ năng hằng ngày miễn phí. Một số đề thi cao cấp và AI chấm chi tiết tính bằng xu.",
	},
	{
		question: "Mình mới mất gốc, có học được không?",
		answer:
			"Được. Bạn tự chọn target level (A2, B1, B2, C1) và deadline phù hợp. Hệ thống tách rõ từng phần luyện theo level, không bắt buộc roadmap.",
	},
	{
		question: "AI chấm bài có chính xác không?",
		answer:
			"AI chấm theo rubric chính thức của Bộ Giáo dục. Phân tích điểm mạnh, gợi ý cải thiện, viết lại từng câu. Kết quả tham khảo, không thay thế giám khảo thật.",
	},
	{
		question: "Mình muốn đổi mục tiêu từ B1 lên B2 thì sao?",
		answer:
			"Mỗi profile gắn với 1 mục tiêu cố định. Bạn tạo profile mới với mục tiêu B2, dữ liệu profile cũ vẫn giữ nguyên để bạn đối chiếu sau này.",
	},
	{
		question: "Có app điện thoại không?",
		answer: "Hiện tại có web đầy đủ tính năng. App mobile đang trong giai đoạn beta, sẽ sớm mở public.",
	},
]

export function LandingFAQ() {
	return (
		<section className="py-14 sm:py-20 lg:py-24">
			<div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-9 sm:mb-12">
					<p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary mb-3">FAQ</p>
					<h2 className="font-sans font-extrabold text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight tracking-tight">
						Câu hỏi thường gặp
					</h2>
				</div>
				<div className="flex flex-col gap-3">
					{FAQS.map((f) => (
						<FaqRow key={f.question} item={f} />
					))}
				</div>
			</div>
		</section>
	)
}

function FaqRow({ item }: { item: FaqItem }) {
	const [open, setOpen] = useState(false)
	return (
		<div className="card overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="w-full flex items-center justify-between gap-4 px-4 py-4 sm:px-5 text-left"
			>
				<span className="text-base font-extrabold text-foreground leading-snug">{item.question}</span>
				<Chevron open={open} />
			</button>
			{open && (
				<div className="px-4 pb-5 -mt-1 text-sm text-muted leading-relaxed border-t border-border-light pt-4 sm:px-5">
					{item.answer}
				</div>
			)}
		</div>
	)
}

function Chevron({ open }: { open: boolean }) {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			stroke="var(--color-muted)"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={`w-5 h-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
			aria-hidden="true"
		>
			<path d="M5 8l5 5 5-5" />
		</svg>
	)
}
