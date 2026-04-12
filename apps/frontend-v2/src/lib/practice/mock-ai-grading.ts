// Mock AI grading result builder. Thay bằng call API thật sau.

import type { AiGradingResult } from "#/components/practice/AiGradingCard"

export function buildMockWritingGrading(wordCount: number): AiGradingResult {
	const task = clamp(6 + (wordCount > 120 ? 1 : 0), 0, 10)
	const coherence = 6.5
	const lexical = 6
	const grammar = 6.5
	const overall = round((task + coherence + lexical + grammar) / 4)

	return {
		overall,
		band: overall >= 7.5 ? "C1" : overall >= 6 ? "B2" : "B1",
		summary:
			"Bài viết có cấu trúc rõ ràng và nội dung bám sát đề. Cần cải thiện sự đa dạng trong cấu trúc câu và lựa chọn từ vựng.",
		criteria: [
			{
				label: "Task Fulfilment",
				score: task,
				comment: "Đã trả lời đủ ý chính của đề, còn thiếu một số luận điểm hỗ trợ.",
			},
			{
				label: "Coherence & Cohesion",
				score: coherence,
				comment: "Các đoạn liên kết khá tốt, nhưng từ nối còn lặp lại (However, For example).",
			},
			{
				label: "Lexical Resource",
				score: lexical,
				comment: "Vốn từ ở mức trung bình, có thể thay thế từ phổ thông bằng từ học thuật hơn.",
			},
			{
				label: "Grammar Range & Accuracy",
				score: grammar,
				comment: "Dùng đúng các thì cơ bản, thỉnh thoảng mắc lỗi chia động từ số ít/số nhiều.",
			},
		],
		strengths: [
			"Mở bài giới thiệu chủ đề rõ ràng",
			"Có ví dụ minh hoạ cụ thể",
			"Kết bài chốt lại quan điểm",
		],
		improvements: [
			"Lặp lại một số cấu trúc câu đơn giản",
			"Thiếu câu phức và câu ghép",
			"Một số lỗi mạo từ (a/an/the)",
		],
		suggestions: [
			"Dùng thêm từ nối: Moreover, Nevertheless, As a result",
			"Thay một số động từ get/do bằng từ chính xác hơn",
			"Đọc lại để bắt lỗi mạo từ và chia động từ",
		],
	}
}

export function buildMockSpeakingGrading(accuracy: number): AiGradingResult {
	const task = accuracy >= 0.8 ? 7 : accuracy >= 0.6 ? 5.5 : 4
	const pronunciation = 6.5
	const lexical = 6
	const grammar = 6
	const overall = round((task + pronunciation + lexical + grammar) / 4)

	return {
		overall,
		band: overall >= 7.5 ? "C1" : overall >= 6 ? "B2" : "B1",
		summary:
			"Phát âm rõ ràng, tốc độ nói ổn định. Có thể mở rộng ý tưởng và sử dụng cấu trúc đa dạng hơn.",
		criteria: [
			{
				label: "Task Fulfilment",
				score: task,
				comment: "Trả lời đúng trọng tâm câu hỏi. Cần kéo dài câu trả lời chi tiết hơn.",
			},
			{
				label: "Pronunciation",
				score: pronunciation,
				comment: "Đa số từ rõ ràng, một vài từ khó (specifically, opportunity) chưa chính xác.",
			},
			{
				label: "Lexical Resource",
				score: lexical,
				comment: "Vốn từ cơ bản, có thể dùng thêm idiom và collocation.",
			},
			{
				label: "Grammar Range & Accuracy",
				score: grammar,
				comment: "Ít lỗi grammar; chủ yếu dùng câu đơn, nên kết hợp câu phức.",
			},
		],
		strengths: [
			"Phát âm các âm cơ bản khá chuẩn",
			"Tốc độ nói tự nhiên, không vấp nhiều",
			"Có dùng một số phrase linking (well, I think)",
		],
		improvements: [
			"Nói hơi ngắn, dưới thời lượng gợi ý",
			"Chưa dùng câu điều kiện/giả định",
			"Intonation ở câu hỏi chưa rõ",
		],
		suggestions: [
			"Luyện thêm câu phức: I believe that... because...",
			"Bổ sung ví dụ cụ thể để kéo dài câu trả lời",
			"Thử shadowing bài mẫu để cải thiện intonation",
		],
	}
}

function round(v: number): number {
	return Math.round(v * 10) / 10
}

function clamp(v: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, v))
}
