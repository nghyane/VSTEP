import { Alert, Card, Descriptions, Flex, List, Progress, Tag, Typography } from "antd"
import type { Criterion, GradingRubric } from "#/features/admin-grading/types"

interface Props {
	rubric: GradingRubric
}

const CRITERION_EXPLANATIONS: Record<string, string[]> = {
	task_fulfillment: [
		"Bài làm có trả lời đúng và đủ các yêu cầu của đề không.",
		"Ý chính có được phát triển đủ sâu, có ví dụ hoặc lập luận hỗ trợ không.",
		"Bài có lập trường rõ ràng và tránh nội dung lạc đề không.",
	],
	grammar: [
		"Hệ thống nhận diện số lượng kiểu cấu trúc ngữ pháp được sử dụng.",
		"Điểm bị giảm theo mật độ lỗi ngữ pháp trên tổng số câu.",
		"Viết ít lỗi nhưng chỉ dùng cấu trúc đơn giản sẽ không được band quá cao.",
	],
	vocabulary: [
		"Đánh giá độ đa dạng từ vựng qua tỷ lệ từ không lặp lại.",
		"Xem xét độ khó của từ qua độ dài từ, CEFR và từ vựng nâng cao.",
		"Điểm từ vựng có trần để tránh metric cơ học đẩy lên band quá cao.",
	],
	organization: [
		"Đánh giá cách chia đoạn, bố cục và mạch triển khai ý.",
		"Cộng điểm khi bài dùng từ nối hợp lý và có độ đa dạng câu.",
		"Bài một đoạn quá dài có thể bị trừ điểm bố cục.",
	],
	fluency: [
		"Đánh giá tốc độ nói theo số từ mỗi phút.",
		"Trừ điểm nếu có quá nhiều khoảng ngập ngừng so với độ dài bài nói.",
	],
	discourse_management: [
		"Đánh giá cách nối ý, phát triển câu trả lời và tổ chức nội dung nói.",
		"Nội dung chưa bám sát câu hỏi sẽ làm giảm điểm tổ chức diễn ngôn.",
	],
	pronunciation: [
		"Dựa trên điểm phát âm từ Azure Speech.",
		"Điểm phản ánh độ rõ âm, trọng âm và khả năng nghe hiểu được.",
	],
}

const FORMULA_LABELS: Record<string, string> = {
	weighted_mean_rounded_half: "Trung bình có trọng số, làm tròn về 0.5 gần nhất",
	mean_rounded_half: "Trung bình các tiêu chí, làm tròn về 0.5 gần nhất",
}

export function RubricExplanation({ rubric }: Props) {
	return (
		<Flex vertical gap={16}>
			<Card title="Cách tính điểm tổng">
				<Flex vertical gap={12}>
					<Alert
						type="info"
						title="Analyzer/AI thu thập bằng chứng, rubric biến bằng chứng thành điểm."
						description={formulaDescription(rubric)}
						showIcon
					/>
					<Descriptions bordered size="small" column={1}>
						<Descriptions.Item label="Công thức">
							{FORMULA_LABELS[rubric.scoring_formula] ?? rubric.scoring_formula}
						</Descriptions.Item>
						<Descriptions.Item label="Thang điểm">Mỗi tiêu chí được chấm từ 0 đến 10.</Descriptions.Item>
						<Descriptions.Item label="Điểm cuối">Làm tròn về mốc 0.5 gần nhất.</Descriptions.Item>
					</Descriptions>
				</Flex>
			</Card>

			<Card title="Các tiêu chí được hiểu như thế nào">
				<List
					grid={{ gutter: 16, xs: 1, md: 2 }}
					dataSource={rubric.criteria}
					renderItem={(criterion) => (
						<List.Item>
							<CriterionExplanation criterion={criterion} />
						</List.Item>
					)}
				/>
			</Card>
		</Flex>
	)
}

function CriterionExplanation({ criterion }: { criterion: Criterion }) {
	const items = CRITERION_EXPLANATIONS[criterion.key] ?? [
		"Tiêu chí này được tính theo mô tả band và cấu hình rubric.",
	]
	const percent = Math.round(criterion.weight * 100)

	return (
		<Card size="small" title={criterion.name_vi ?? criterion.name} extra={<Tag color="blue">{percent}%</Tag>}>
			<Flex vertical gap={12}>
				<Progress percent={percent} size="small" showInfo={false} />
				<Typography.Text type="secondary">Điểm tối đa: {criterion.max_score}</Typography.Text>
				<List
					size="small"
					dataSource={items}
					renderItem={(item) => (
						<List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
							<Typography.Text>{item}</Typography.Text>
						</List.Item>
					)}
				/>
			</Flex>
		</Card>
	)
}

function formulaDescription(rubric: GradingRubric): string {
	if (rubric.scoring_formula === "weighted_mean_rounded_half") {
		return "Điểm từng tiêu chí được nhân với trọng số. Writing thường ưu tiên Task Fulfillment cao hơn các tiêu chí còn lại."
	}

	if (rubric.scoring_formula === "mean_rounded_half") {
		return "Các tiêu chí có vai trò ngang nhau. Điểm tổng là trung bình cộng của các tiêu chí."
	}

	return "Điểm tổng được tính theo công thức đang lưu trong rubric."
}
