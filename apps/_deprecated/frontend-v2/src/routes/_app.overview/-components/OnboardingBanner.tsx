// OnboardingBanner — hiện khi user chưa có goal và chưa có skill data nào.
// Spec: rounded-2xl border-amber-200 bg-amber-50
// Source: skill-design.md §4.7

import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "#/shared/ui/button"

interface Props {
	onStart: () => void
}

export function OnboardingBanner({ onStart }: Props) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
			<div className="flex items-center gap-3">
				<Sparkles className="size-5 shrink-0 text-amber-500" />
				<div>
					<p className="font-semibold text-amber-900">Bạn chưa hoàn thành đánh giá trình độ</p>
					<p className="mt-0.5 text-sm text-amber-700">
						Hãy đánh giá trình độ và đặt mục tiêu để có lộ trình học phù hợp
					</p>
				</div>
			</div>
			<Button size="sm" onClick={onStart} className="shrink-0">
				Bắt đầu
				<ArrowRight className="size-4" />
			</Button>
		</div>
	)
}
