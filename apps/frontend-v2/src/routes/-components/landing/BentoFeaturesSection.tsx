import { cn } from "#/shared/lib/utils"
import { BENTO_FEATURES, SKILLS } from "./constants"

export function BentoFeaturesSection() {
	return (
		<section aria-label="Tính năng nổi bật">
			<div className="mx-auto w-full max-w-6xl px-6 py-20">
				<div className="text-center">
					<h2 className="text-2xl font-bold lg:text-3xl">Mọi thứ bạn cần để chinh phục VSTEP</h2>
					<p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
						AI chấm bài, lộ trình cá nhân, 4 kỹ năng đầy đủ — tất cả trong một nền tảng.
					</p>
				</div>

				{/* Bento grid: 1 large (2x2) + 4 small */}
				<div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
					{BENTO_FEATURES.map((f) => {
						const Icon = f.icon
						const isLarge = f.size === "large"
						return (
							<div
								key={f.title}
								className={cn(
									"group rounded-2xl border bg-card p-6 transition hover:shadow-md",
									isLarge && "sm:col-span-2 sm:row-span-2 sm:p-8",
								)}
							>
								<div
									className={cn(
										"inline-flex items-center justify-center rounded-xl bg-primary/10",
										isLarge ? "size-12" : "size-10",
									)}
								>
									<Icon className={cn("text-primary", isLarge ? "size-6" : "size-5")} />
								</div>
								<h3 className={cn("mt-4 font-bold", isLarge ? "text-xl lg:text-2xl" : "text-base")}>
									{f.title}
								</h3>
								<p
									className={cn(
										"mt-2 leading-relaxed text-muted-foreground",
										isLarge ? "text-base" : "text-sm",
									)}
								>
									{f.desc}
								</p>
							</div>
						)
					})}
				</div>

				{/* 4 Skills row */}
				<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{SKILLS.map((skill) => {
						const Icon = skill.icon
						return (
							<div
								key={skill.label}
								className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
							>
								<div
									className={cn(
										"inline-flex size-10 items-center justify-center rounded-xl",
										skill.bg,
									)}
								>
									<Icon className={cn("size-5", skill.color)} />
								</div>
								<h3 className="mt-3 font-semibold">{skill.label}</h3>
								<p className="text-sm text-muted-foreground">{skill.desc}</p>
								<p className="mt-2 text-xs leading-relaxed text-muted-foreground/70">
									{skill.detail}
								</p>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}
