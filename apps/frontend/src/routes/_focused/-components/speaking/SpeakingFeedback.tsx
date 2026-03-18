export function SpeakingFeedback() {
	return (
		<div className="space-y-3 rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-800 dark:bg-purple-950/20">
			<h3 className="text-lg font-bold">Gợi ý trả lời</h3>
			<ul className="space-y-2 text-sm">
				<li>Hãy mở đầu bằng câu giới thiệu chung về chủ đề.</li>
				<li>Đưa ra ví dụ cụ thể từ trải nghiệm cá nhân của bạn.</li>
				<li>
					Sử dụng liên từ để nối các ý:{" "}
					<span className="font-medium">However, Moreover, In addition, Furthermore</span>
				</li>
				<li>Kết thúc bằng câu tổng kết hoặc nêu quan điểm cá nhân.</li>
				<li>Chú ý phát âm rõ ràng, tốc độ vừa phải, và duy trì giao tiếp mắt.</li>
			</ul>
		</div>
	)
}
