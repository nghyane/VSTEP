import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"

export function SkillsSection() {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Kỹ năng</h3>
			<p className="text-sm text-subtle mb-5">Luyện 4 kỹ năng VSTEP · bật/tắt hỗ trợ tùy nhu cầu</p>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Link to="/luyen-tap/nghe" className="card-interactive p-5">
					<Icon name="volume" size="lg" className="text-skill-listening mb-3" />
					<h4 className="font-bold text-base text-foreground">Nghe</h4>
					<p className="text-xs text-subtle mt-0.5">Listening</p>
					<p className="text-sm text-muted mt-2">3 phần · nghe hiểu</p>
				</Link>

				<Link to="/luyen-tap/doc" className="card-interactive p-5">
					<Icon name="book" size="lg" className="text-skill-reading mb-3" />
					<h4 className="font-bold text-base text-foreground">Đọc</h4>
					<p className="text-xs text-subtle mt-0.5">Reading</p>
					<p className="text-sm text-muted mt-2">4 đoạn văn · đọc hiểu</p>
				</Link>

				<Link to="/luyen-tap/viet" className="card-interactive p-5">
					<Icon name="pencil" size="lg" className="text-skill-writing mb-3" />
					<h4 className="font-bold text-base text-foreground">Viết</h4>
					<p className="text-xs text-subtle mt-0.5">Writing</p>
					<p className="text-sm text-muted mt-2">Thư + luận · AI chấm</p>
				</Link>

				<Link to="/luyen-tap/noi" className="card-interactive p-5">
					<Icon name="mic" size="lg" className="text-skill-speaking mb-3" />
					<h4 className="font-bold text-base text-foreground">Nói</h4>
					<p className="text-xs text-subtle mt-0.5">Speaking</p>
					<p className="text-sm text-muted mt-2">3 phần · ghi âm + AI</p>
				</Link>
			</div>
		</section>
	)
}
