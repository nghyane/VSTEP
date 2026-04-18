// PassagePanel — bài đọc với interactive words + text selection popup.

import { InteractivePassage } from "#/components/practice/InteractivePassage"
import { TextSelectionPopup } from "#/components/practice/TextSelectionPopup"
import type { ReadingExercise } from "#/lib/mock/reading"

export function PassagePanel({ exercise }: { exercise: ReadingExercise }) {
	const paragraphs = exercise.passage.split(/\n\n+/).filter((p) => p.trim().length > 0)
	return (
		<TextSelectionPopup
			promptTemplate={(text) =>
				`Trong bài đọc tiếng Anh về chủ đề "${exercise.title}", hãy giải thích:\n"${text}"\n\nDịch nghĩa, phân tích ngữ pháp (nếu là cụm từ/câu), và cho ví dụ tương tự.`
			}
		>
			<div className="rounded-2xl border bg-card p-6 shadow-sm">
				<h2 className="mb-4 text-lg font-bold">{exercise.title}</h2>
				<div className="space-y-3 text-sm leading-relaxed text-foreground/90">
					{paragraphs.map((para, index) => (
						<p key={`passage-${index}`}>
							<InteractivePassage text={para} />
						</p>
					))}
				</div>
			</div>
		</TextSelectionPopup>
	)
}
