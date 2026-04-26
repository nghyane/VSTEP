import { Link } from "@tanstack/react-router"
import { StaticIcon } from "#/components/Icon"

export function OnboardingRow() {
	return (
		<section className="card p-5 flex items-center gap-5">
			<StaticIcon name="target-md" size="lg" />
			<div className="flex-1 min-w-0">
				<h4 className="font-bold text-base text-foreground">Hãy làm bài thi đầu tiên để xem trình độ thật</h4>
				<p className="text-sm text-subtle mt-0.5">
					Sau bài full-test đầu, dashboard sẽ ước tính band và chỉ ra kỹ năng cần luyện
				</p>
			</div>
			<Link to="/thi-thu" className="btn btn-primary shrink-0">
				Bắt đầu
			</Link>
		</section>
	)
}
