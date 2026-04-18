import { createFileRoute, Link } from "@tanstack/react-router"
import {
	AlarmClock,
	ArrowRight,
	BookOpenText,
	BookType,
	ClipboardCheck,
	Dumbbell,
	FilePen,
	GraduationCap,
	Headphones,
	Highlighter,
	Infinity as InfinityIcon,
	Languages,
	ListOrdered,
	type LucideIcon,
	Mic,
	PencilLine,
	Repeat,
	ToggleRight,
} from "lucide-react"
import { Button } from "#/components/ui/button"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app/luyen-tap/")({
	component: LuyenTapIndexPage,
})

// ─── Types ─────────────────────────────────────────────────────────

interface Feature {
	icon: LucideIcon
	text: string
}

interface Stat {
	value: string
	label: string
}

type ChipTone = "primary" | "listening" | "reading" | "writing" | "speaking"

interface Chip {
	icon: LucideIcon
	label: string
	tone: ChipTone
}

interface ModeData {
	titleIcon: LucideIcon
	title: string
	subtitle: string
	description: string
	chips: Chip[]
	features: Feature[]
	stats: Stat[]
	cta: string
	to?: "/luyen-tap/nen-tang" | "/luyen-tap/ky-nang"
}

// ─── Data ──────────────────────────────────────────────────────────

const FOUNDATION: ModeData = {
	titleIcon: GraduationCap,
	title: "Luyện tập nền tảng",
	subtitle: "Xây nền móng từ A1 đến C1",
	description:
		"Học theo tốc độ của riêng bạn. Tập trung vào từ vựng và ngữ pháp — gốc rễ của mọi kỹ năng VSTEP.",
	chips: [
		{ icon: Languages, label: "Từ vựng", tone: "primary" },
		{ icon: BookType, label: "Ngữ pháp", tone: "primary" },
	],
	features: [
		{ icon: Repeat, text: "Từ vựng theo chủ đề với hệ thống SRS (lặp lại cách quãng)" },
		{ icon: ListOrdered, text: "Ngữ pháp có cấu trúc, từ cơ bản đến nâng cao" },
		{ icon: InfinityIcon, text: "Không giới hạn thời gian, học theo tốc độ của bạn" },
		{ icon: FilePen, text: "Lưu nháp và quay lại làm bất kỳ lúc nào" },
	],
	stats: [
		{ value: "60+", label: "chủ đề" },
		{ value: "200+", label: "điểm ngữ pháp" },
		{ value: "SRS", label: "lặp lại" },
	],
	cta: "Bắt đầu học",
	to: "/luyen-tap/nen-tang",
}

const SKILLS: ModeData = {
	titleIcon: Dumbbell,
	title: "Luyện tập 4 kỹ năng",
	subtitle: "Nghe · Đọc · Viết · Nói",
	description:
		"Luyện đủ bốn kỹ năng VSTEP. Bật chế độ hỗ trợ khi cần gợi ý, tắt đi khi muốn tự thử sức.",
	chips: [
		{ icon: Headphones, label: "Nghe", tone: "listening" },
		{ icon: BookOpenText, label: "Đọc", tone: "reading" },
		{ icon: PencilLine, label: "Viết", tone: "writing" },
		{ icon: Mic, label: "Nói", tone: "speaking" },
	],
	features: [
		{ icon: ToggleRight, text: "Bật/tắt chế độ hỗ trợ linh hoạt theo nhu cầu" },
		{ icon: Highlighter, text: "Công cụ Highlight và Note ngay trong lúc làm bài" },
		{ icon: ClipboardCheck, text: "Chấm điểm chi tiết, giải thích rõ đáp án từng câu" },
		{ icon: AlarmClock, text: "Hẹn giờ tùy chọn — có bấm giờ hay thong thả tùy bạn" },
	],
	stats: [
		{ value: "4", label: "kỹ năng" },
		{ value: "2", label: "chế độ hỗ trợ" },
		{ value: "AI", label: "chấm điểm" },
	],
	cta: "Bắt đầu luyện tập",
	to: "/luyen-tap/ky-nang",
}

const CHIP_TONE_CLASSES: Record<ChipTone, string> = {
	primary: "bg-primary/10 text-primary",
	listening: "bg-skill-listening/10 text-skill-listening",
	reading: "bg-skill-reading/10 text-skill-reading",
	writing: "bg-skill-writing/10 text-skill-writing",
	speaking: "bg-skill-speaking/10 text-skill-speaking",
}

// ─── Page ──────────────────────────────────────────────────────────

function LuyenTapIndexPage() {
	return (
		<div className="mx-auto w-full max-w-6xl">
			<PageHeader />
			<div className="mt-10 grid items-stretch gap-6 md:grid-cols-2">
				<ModeCard data={FOUNDATION} />
				<ModeCard data={SKILLS} />
			</div>
		</div>
	)
}

function PageHeader() {
	return (
		<div className="text-center">
			<h1 className="text-3xl font-bold tracking-tight md:text-4xl">Chọn chế độ luyện tập</h1>
			<p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
				Hai chế độ, một lộ trình — xây nền tảng vững trước, rồi luyện đủ bốn kỹ năng.
			</p>
		</div>
	)
}

// ─── Card ──────────────────────────────────────────────────────────

function ModeCard({ data }: { data: ModeData }) {
	const cardClass =
		"group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
	const body = (
		<>
			<ModeCardHeader data={data} />
			<div className="flex flex-1 flex-col gap-5 px-8 py-6">
				<FeatureList features={data.features} />
				<StatRow stats={data.stats} />
			</div>
			<div className="px-8 pb-8">
				<div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
					{data.cta}
					<ArrowRight className="size-4" />
				</div>
			</div>
		</>
	)

	if (data.to) {
		return (
			<Link to={data.to} className={cn(cardClass, "cursor-pointer")}>
				{body}
			</Link>
		)
	}
	return (
		<div className={cardClass}>
			<ModeCardHeader data={data} />
			<div className="flex flex-1 flex-col gap-5 px-8 py-6">
				<FeatureList features={data.features} />
				<StatRow stats={data.stats} />
			</div>
			<div className="px-8 pb-8">
				<Button type="button" size="lg" className="h-12 w-full rounded-2xl text-base font-semibold">
					{data.cta}
					<ArrowRight className="size-4" />
				</Button>
			</div>
		</div>
	)
}

function ModeCardHeader({ data }: { data: ModeData }) {
	const Icon = data.titleIcon
	return (
		<div className="px-8 pt-8 pb-6">
			<div className="flex items-center gap-4">
				<Icon className="size-10 shrink-0 text-primary" />
				<div className="min-w-0">
					<h2 className="truncate text-xl font-bold">{data.title}</h2>
					<p className="truncate text-sm text-muted-foreground">{data.subtitle}</p>
				</div>
			</div>
			<p className="mt-4 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
			<div className="mt-4 flex flex-wrap gap-2">
				{data.chips.map((chip) => (
					<ChipBadge key={chip.label} chip={chip} />
				))}
			</div>
		</div>
	)
}

// ─── Sub-components ────────────────────────────────────────────────

function ChipBadge({ chip }: { chip: Chip }) {
	const Icon = chip.icon
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
				CHIP_TONE_CLASSES[chip.tone],
			)}
		>
			<Icon className="size-3" />
			{chip.label}
		</span>
	)
}

function FeatureList({ features }: { features: Feature[] }) {
	return (
		<ul className="flex flex-col gap-3">
			{features.map((f) => {
				const Icon = f.icon
				return (
					<li key={f.text} className="flex items-start gap-3">
						<Icon className="mt-0.5 size-5 shrink-0 text-primary" />
						<span className="text-sm leading-relaxed text-foreground/80">{f.text}</span>
					</li>
				)
			})}
		</ul>
	)
}

function StatRow({ stats }: { stats: Stat[] }) {
	return (
		<div className="grid grid-cols-3 gap-3">
			{stats.map((s) => (
				<div key={s.label} className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
					<p className="text-lg font-bold tabular-nums">{s.value}</p>
					<p className="text-[11px] text-muted-foreground">{s.label}</p>
				</div>
			))}
		</div>
	)
}
