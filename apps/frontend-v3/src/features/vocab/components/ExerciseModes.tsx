import { Link } from "@tanstack/react-router"
import { SkillIcon } from "#/components/SkillIcon"

interface Props {
	topicId: string
}

export function ExerciseModes({ topicId }: Props) {
	return (
		<section>
			<h3 className="font-bold text-sm text-subtle mb-3">Bài tập bổ trợ</h3>
			<div className="grid grid-cols-3 gap-3">
				<Link
					to="/vocab/$topicId/exercise"
					params={{ topicId }}
					search={{ kind: "mcq" }}
					className="card-interactive p-4 text-left"
				>
					<SkillIcon name="vocabulary" size="md" className="mb-2" />
					<h4 className="font-bold text-sm text-foreground">Trắc nghiệm</h4>
					<p className="text-xs text-subtle mt-0.5">Chọn đáp án đúng</p>
				</Link>
				<Link
					to="/vocab/$topicId/exercise"
					params={{ topicId }}
					search={{ kind: "fill_blank" }}
					className="card-interactive p-4 text-left"
				>
					<SkillIcon name="writing" size="md" className="mb-2" />
					<h4 className="font-bold text-sm text-foreground">Điền từ</h4>
					<p className="text-xs text-subtle mt-0.5">Điền vào chỗ trống</p>
				</Link>
				<Link
					to="/vocab/$topicId/exercise"
					params={{ topicId }}
					search={{ kind: "word_form" }}
					className="card-interactive p-4 text-left"
				>
					<SkillIcon name="grammar" size="md" className="mb-2" />
					<h4 className="font-bold text-sm text-foreground">Biến đổi từ</h4>
					<p className="text-xs text-subtle mt-0.5">Chia dạng từ đúng</p>
				</Link>
			</div>
		</section>
	)
}
