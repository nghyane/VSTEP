import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"

interface Props {
	topicId: string
}

export function ExerciseModes({ topicId }: Props) {
	return (
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
	)
}
