import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { vocabTopicDetailQuery } from "#/features/vocab/queries"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app/luyen-tap/tu-vung/$topicId")({
	component: TopicDetailPage,
})

const STATE_LABEL: Record<string, { text: string; color: string }> = {
	new: { text: "Mới", color: "bg-info-tint text-info" },
	learning: { text: "Đang học", color: "bg-warning-tint text-warning" },
	review: { text: "Ôn tập", color: "bg-primary-tint text-primary" },
	relearning: { text: "Học lại", color: "bg-destructive-tint text-destructive" },
}

function TopicDetailPage() {
	const { topicId } = Route.useParams()
	const { data, isLoading } = useQuery(vocabTopicDetailQuery(topicId))
	const [wordsOpen, setWordsOpen] = useState(false)

	const detail = data?.data
	const topic = detail?.topic
	const words = detail?.words ?? []

	if (isLoading) {
		return (
			<>
				<Header title="Từ vựng" />
				<div className="px-10 pb-12">
					<p className="text-muted">Đang tải...</p>
				</div>
			</>
		)
	}

	if (!topic) return null

	const newCount = words.filter((w) => w.state.kind === "new").length
	const learnedCount = words.length - newCount

	return (
		<>
			<Header title={topic.name} />
			<div className="px-10 pb-12 space-y-6">
				{/* Hero card */}
				<section className="card p-6 text-center">
					<span className="text-xs font-bold text-primary bg-primary-tint px-2.5 py-1 rounded-full">
						{topic.level}
					</span>
					<h2 className="font-extrabold text-2xl text-foreground mt-3">{topic.name}</h2>
					{topic.description && (
						<p className="text-sm text-muted mt-1">{topic.description}</p>
					)}

					{/* Progress */}
					<div className="flex items-center gap-3 mt-5 max-w-xs mx-auto">
						<div className="flex-1 h-2.5 bg-background rounded-full overflow-hidden">
							<div
								className="h-full bg-primary rounded-full transition-all"
								style={{ width: `${words.length ? (learnedCount / words.length) * 100 : 0}%` }}
							/>
						</div>
						<span className="text-xs font-bold text-muted">{learnedCount}/{words.length}</span>
					</div>

					{/* Primary CTA */}
					<Link
						to="/vocab/$topicId/flashcard"
						params={{ topicId }}
						className="btn btn-primary px-10 py-3.5 text-base mt-6"
					>
						Học Flashcard · {words.length} từ
					</Link>
				</section>

				{/* Bài tập bổ trợ */}
				<section>
					<h3 className="font-bold text-sm text-subtle mb-3">Bài tập bổ trợ</h3>
					<div className="grid grid-cols-3 gap-3">
						<Link to="/vocab/$topicId/exercise" params={{ topicId }} search={{ kind: "mcq" }} className="card-interactive p-4 text-left">
							<Icon name="check" size="md" style={{ color: "var(--color-info)" }} className="mb-2" />
							<h4 className="font-bold text-sm text-foreground">Trắc nghiệm</h4>
							<p className="text-xs text-subtle mt-0.5">Chọn đáp án đúng</p>
						</Link>
						<Link to="/vocab/$topicId/exercise" params={{ topicId }} search={{ kind: "fill_blank" }} className="card-interactive p-4 text-left">
							<Icon name="pencil" size="md" style={{ color: "var(--color-skill-writing)" }} className="mb-2" />
							<h4 className="font-bold text-sm text-foreground">Điền từ</h4>
							<p className="text-xs text-subtle mt-0.5">Điền vào chỗ trống</p>
						</Link>
						<Link to="/vocab/$topicId/exercise" params={{ topicId }} search={{ kind: "word_form" }} className="card-interactive p-4 text-left">
							<Icon name="book" size="md" style={{ color: "var(--color-skill-reading)" }} className="mb-2" />
							<h4 className="font-bold text-sm text-foreground">Biến đổi từ</h4>
							<p className="text-xs text-subtle mt-0.5">Chia dạng từ đúng</p>
						</Link>
					</div>
				</section>

				{/* Word list — collapsible */}
				<section className="card overflow-hidden">
					<button
						type="button"
						onClick={() => setWordsOpen((v) => !v)}
						className="w-full flex items-center justify-between p-5 hover:bg-background transition"
					>
						<div className="flex items-center gap-2">
							<h3 className="font-bold text-base text-foreground">Từ vựng trong chủ đề</h3>
							<span className="text-xs font-bold text-subtle">{words.length} từ</span>
						</div>
						<Icon
							name="back"
							size="xs"
							className={cn("text-subtle transition-transform", wordsOpen ? "-rotate-90" : "rotate-180")}
						/>
					</button>

					{wordsOpen && (
						<div className="border-t border-border">
							{words.map(({ word: w, state }) => {
								const badge = STATE_LABEL[state.kind] ?? STATE_LABEL.new
								return (
									<div key={w.id} className="flex items-start gap-4 px-5 py-3.5 border-b border-border last:border-b-0">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-0.5">
												<span className="font-bold text-sm text-foreground">{w.word}</span>
												{w.phonetic && <span className="text-xs text-subtle">{w.phonetic}</span>}
												{w.part_of_speech && (
													<span className="text-xs text-muted bg-background px-1.5 py-0.5 rounded">{w.part_of_speech}</span>
												)}
											</div>
											<p className="text-sm text-muted">{w.definition}</p>
											{w.example && <p className="text-xs text-subtle mt-0.5 italic">"{w.example}"</p>}
										</div>
										<span className={cn("text-xs font-bold px-2 py-0.5 rounded-full shrink-0", badge.color)}>
											{badge.text}
										</span>
									</div>
								)
							})}
						</div>
					)}
				</section>
			</div>
		</>
	)
}
