import { CheckCircle2, Flame, Target } from "lucide-react"
import { type MotionValue, motion, useScroll, useSpring, useTransform } from "motion/react"
import { useRef } from "react"
import { cn } from "#/shared/lib/utils"
import { AnimSection, SectionHeading } from "../lib/shared"

const STEPS = [
	{
		title: "Làm bài thi thử",
		desc: "Chọn đề thi VSTEP đầy đủ 4 kỹ năng hoặc luyện riêng từng phần. Bắt đầu chỉ trong 30 giây.",
		icon: CheckCircle2,
		image: "/images/buoc1.jpg",
	},
	{
		title: "AI chấm điểm tức thì",
		desc: "Hệ thống AI phân tích bài Writing và Speaking theo rubric chuẩn, trả kết quả trong vài phút.",
		icon: Target,
		image: "/images/buoc2.jpg",
	},
	{
		title: "Xem lộ trình cá nhân",
		desc: "Nhận phân tích điểm mạnh - yếu và bài tập được gợi ý riêng theo trình độ của bạn.",
		icon: Flame,
		image: "/images/buoc3.jpg",
	},
] as const

export function HowItWorksSection() {
	const containerRef = useRef<HTMLDivElement>(null)
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	})

	return (
		<section id="how-it-works" className="py-12 sm:py-20">
			<div className="mx-auto w-full max-w-5xl px-6">
				<AnimSection>
					<SectionHeading
						title="Tối ưu hành trình luyện thi VSTEP"
						subtitle="3 bước đơn giản để chinh phục VSTEP cùng AI"
					/>
				</AnimSection>
			</div>
			<div
				ref={containerRef}
				className="mx-auto mt-8 h-[185vh] w-full max-w-6xl px-4 sm:mt-12 sm:h-[230vh] sm:px-6 lg:px-10"
			>
				<div className="sticky top-14 sm:top-16">
					<div className="relative">
						{STEPS.map((step, index) => (
							<StepCard
								key={step.title}
								step={step}
								index={index}
								total={STEPS.length}
								scrollProgress={scrollYProgress}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}

function StepCard({
	step,
	index,
	total,
	scrollProgress,
}: {
	step: (typeof STEPS)[number]
	index: number
	total: number
	scrollProgress: MotionValue<number>
}) {
	const isLast = index === total - 1
	const animated = total - 1
	const segStart = animated > 0 ? index / animated : 0
	const segEnd = animated > 0 ? (index + 1) / animated : 1
	const rawY = useTransform(scrollProgress, [segStart, segEnd], [0, -120])
	const springY = useSpring(rawY, { stiffness: 300, damping: 40, mass: 0.5 })
	const y = useTransform(springY, (v) => `${v}%`)
	const Icon = step.icon

	return (
		<motion.div
			className={cn(
				index === 0 ? "relative" : "absolute inset-0",
				"flex min-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-3xl bg-primary p-4 sm:p-6 lg:p-8",
			)}
			style={{ y: isLast ? undefined : y, zIndex: total - index }}
		>
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-foreground/10 to-primary-foreground/5 opacity-60" />
			<p className="relative text-3xl font-bold text-primary-foreground/15 sm:text-5xl lg:text-7xl">
				Bước {index + 1}
			</p>
			<div className="relative mt-3 grid flex-1 gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-6">
				<div className="space-y-3">
					<div className="inline-flex items-center gap-2 text-white/85">
						<Icon className="size-5" />
						<span className="text-sm font-medium">Bước {index + 1}</span>
					</div>
					<h3 className="text-lg font-bold text-white lg:text-xl">{step.title}</h3>
					<p className="text-sm leading-relaxed text-white/70">{step.desc}</p>
				</div>
				<div className="overflow-hidden rounded-2xl bg-white/8">
					<img
						src={step.image}
						alt={step.title}
						className="aspect-video w-full rounded-2xl object-cover"
					/>
				</div>
			</div>
		</motion.div>
	)
}
