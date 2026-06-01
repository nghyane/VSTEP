import { Book02Icon, BulbIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

interface ListeningKeyword {
	word: string
	phonetic: string
	meaning: string
	example?: string
	relatedQuestions?: number[]
}

export const MOCK_LISTENING_KEYWORDS: Record<string, ListeningKeyword[]> = {
	"listen-3": [
		{
			word: "sustainable",
			phonetic: "/səˈsteɪnəbl/",
			meaning: "bền vững, có thể duy trì lâu dài",
			example: "sustainable farming methods",
			relatedQuestions: [1],
		},
		{
			word: "crop yield",
			phonetic: "/krɒp jiːld/",
			meaning: "sản lượng cây trồng",
			example: "increase the crop yield",
			relatedQuestions: [2],
		},
		{
			word: "soil nutrients",
			phonetic: "/sɔɪl ˈnjuːtriənts/",
			meaning: "chất dinh dưỡng trong đất",
			example: "preserve soil nutrients",
			relatedQuestions: [2],
		},
		{
			word: "subsidies",
			phonetic: "/ˈsʌbsɪdiz/",
			meaning: "trợ cấp, hỗ trợ tài chính",
			example: "government subsidies for farmers",
			relatedQuestions: [4],
		},
		{
			word: "adopt",
			phonetic: "/əˈdɒpt/",
			meaning: "áp dụng, chấp nhận (phương pháp mới)",
			example: "adopt new techniques",
			relatedQuestions: [5],
		},
		{
			word: "integration",
			phonetic: "/ˌɪntɪˈɡreɪʃn/",
			meaning: "sự tích hợp, kết hợp",
			example: "integration of technology",
			relatedQuestions: [6],
		},
		{
			word: "case study",
			phonetic: "/keɪs ˈstʌdi/",
			meaning: "nghiên cứu tình huống thực tế",
			example: "real-world case studies",
			relatedQuestions: [7],
		},
		{
			word: "pesticide",
			phonetic: "/ˈpestɪsaɪd/",
			meaning: "thuốc trừ sâu",
			example: "reduce the use of pesticides",
			relatedQuestions: [6],
		},
	],
}

export function ListeningKeywordsPanel({
	examId,
	currentQuestion,
}: {
	examId: string
	currentQuestion: number | null
}) {
	const keywords = MOCK_LISTENING_KEYWORDS[examId] ?? []
	if (keywords.length === 0) return null

	return (
		<aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l bg-muted/5 lg:block">
			<div className="space-y-4 p-4">
				{/* Header */}
				<div className="flex items-center gap-2">
					<div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
						<HugeiconsIcon icon={Book02Icon} className="size-4" />
					</div>
					<div>
						<p className="text-sm font-semibold">Từ vựng gợi ý</p>
						<p className="text-[10px] text-muted-foreground">Lắng nghe những từ khóa này</p>
					</div>
				</div>

				{/* Keywords list */}
				<div className="space-y-2">
					{keywords.map((kw) => {
						const isRelated =
							currentQuestion !== null && kw.relatedQuestions?.includes(currentQuestion)
						return (
							<div
								key={kw.word}
								className={cn(
									"rounded-lg border p-2.5 transition-all duration-200",
									isRelated
										? "border-sky-300 bg-sky-50/80 shadow-sm dark:border-sky-700 dark:bg-sky-950/30"
										: "border-transparent bg-background",
								)}
							>
								<div className="flex items-baseline justify-between gap-2">
									<span className="text-sm font-semibold">{kw.word}</span>
									<span className="text-[10px] text-muted-foreground">{kw.phonetic}</span>
								</div>
								<p className="mt-0.5 text-xs text-muted-foreground">{kw.meaning}</p>
								{kw.example && (
									<p className="mt-1 text-[11px] italic text-primary/70">"{kw.example}"</p>
								)}
								{isRelated && (
									<div className="mt-1.5 flex items-center gap-1">
										<HugeiconsIcon icon={BulbIcon} className="size-3 text-sky-500" />
										<span className="text-[10px] font-medium text-sky-600 dark:text-sky-400">
											Liên quan câu {currentQuestion}
										</span>
									</div>
								)}
							</div>
						)
					})}
				</div>

				{/* Listening tips */}
				<div className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700 dark:bg-amber-950/20">
					<div className="flex items-center gap-1.5">
						<HugeiconsIcon
							icon={Tick02Icon}
							className="size-3.5 text-amber-600 dark:text-amber-400"
						/>
						<p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Mẹo nghe</p>
					</div>
					<ul className="space-y-1">
						<li className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
							<span className="mt-1 size-1 shrink-0 rounded-full bg-amber-500" />
							Đọc câu hỏi trước khi nghe để biết cần tìm thông tin gì.
						</li>
						<li className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
							<span className="mt-1 size-1 shrink-0 rounded-full bg-amber-500" />
							Chú ý từ đồng nghĩa — đáp án thường paraphrase lại nội dung nghe.
						</li>
						<li className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
							<span className="mt-1 size-1 shrink-0 rounded-full bg-amber-500" />
							Lắng nghe các từ khóa được highlight bên cạnh.
						</li>
					</ul>
				</div>
			</div>
		</aside>
	)
}
