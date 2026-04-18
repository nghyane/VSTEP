import { BookOpenText, Headphones, Mic, PencilLine } from "lucide-react"
import { cn } from "#/shared/lib/utils"
import { AnimSection, SectionHeading, TiltCard } from "../lib/shared"

const SKILLS = [
	{
		label: "Listening",
		desc: "Luyện nghe hội thoại và bài giảng thực tế",
		icon: Headphones,
		color: "bg-skill-listening/12 text-skill-listening",
	},
	{
		label: "Reading",
		desc: "Phân tích đoạn văn và trả lời câu hỏi trọng tâm",
		icon: BookOpenText,
		color: "bg-skill-reading/12 text-skill-reading",
	},
	{
		label: "Writing",
		desc: "Viết thư, luận và nhận phản hồi từ AI",
		icon: PencilLine,
		color: "bg-skill-writing/12 text-skill-writing",
	},
	{
		label: "Speaking",
		desc: "Luyện nói theo chủ đề và nghe bài mẫu tham khảo",
		icon: Mic,
		color: "bg-skill-speaking/12 text-skill-speaking",
	},
] as const

export function SkillsSection() {
	return (
		<section className="bg-muted/20">
			<div className="mx-auto w-full max-w-5xl px-6 py-20">
				<AnimSection>
					<SectionHeading
						title="4 kỹ năng, một nền tảng"
						subtitle="Luyện tập toàn diện Nghe – Đọc – Viết – Nói"
					/>
				</AnimSection>
				<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SKILLS.map((skill, i) => {
						const Icon = skill.icon
						return (
							<AnimSection key={skill.label} delay={i * 100}>
								<TiltCard className="rounded-2xl bg-muted/30 p-6 transition-colors hover:bg-muted/50">
									<Icon className={cn("mb-4 size-6", skill.color.split(" ")[1])} />
									<h3 className="font-bold">{skill.label}</h3>
									<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{skill.desc}</p>
								</TiltCard>
							</AnimSection>
						)
					})}
				</div>
			</div>
		</section>
	)
}
