import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"

export function FoundationSection() {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Nền tảng</h3>
			<p className="text-sm text-subtle mb-5">Từ vựng và ngữ pháp — gốc rễ mọi kỹ năng</p>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Link to="/luyen-tap/tu-vung" className="card-interactive p-5">
					<div className="flex items-start gap-4">
						<Icon name="book" size="lg" className="text-skill-writing shrink-0" />
						<div>
							<h4 className="font-bold text-lg text-foreground">Từ vựng</h4>
							<p className="text-sm text-subtle mt-0.5">Flashcard SRS · 60+ chủ đề theo level</p>
						</div>
					</div>
				</Link>

				<Link to="/luyen-tap/ngu-phap" className="card-interactive p-5">
					<div className="flex items-start gap-4">
						<Icon name="pencil" size="lg" className="text-skill-reading shrink-0" />
						<div>
							<h4 className="font-bold text-lg text-foreground">Ngữ pháp</h4>
							<p className="text-sm text-subtle mt-0.5">Cấu trúc câu gắn level A2–C1</p>
						</div>
					</div>
				</Link>
			</div>
		</section>
	)
}
