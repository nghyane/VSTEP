import type { SystemConfigRow } from "./types"

/**
 * Nhóm configs theo namespace (prefix trước dấu chấm đầu tiên).
 * VD: `chart.min_tests` → group "chart".
 */
export function groupConfigsByNamespace(
	rows: SystemConfigRow[],
): Array<{ namespace: string; items: SystemConfigRow[] }> {
	const groups = new Map<string, SystemConfigRow[]>()
	for (const row of rows) {
		const ns = row.key.split(".")[0] ?? "misc"
		if (!groups.has(ns)) groups.set(ns, [])
		groups.get(ns)?.push(row)
	}
	return Array.from(groups.entries())
		.map(([namespace, items]) => ({ namespace, items: items.sort((a, b) => a.key.localeCompare(b.key)) }))
		.sort((a, b) => a.namespace.localeCompare(b.namespace))
}

const NAMESPACE_LABELS: Record<string, string> = {
	chart: "Chart (Spider/Line)",
	streak: "Streak (chuỗi học liên tục)",
	grading: "Chấm bài",
	exam: "Đề thi (chi phí coin)",
	support: "Hỗ trợ",
	onboarding: "Onboarding",
	profile: "Profile",
}

export function namespaceLabel(ns: string): string {
	return NAMESPACE_LABELS[ns] ?? ns
}

/**
 * Nhãn thân thiện cho từng config key — hiển thị cho admin non-tech.
 * Key gốc vẫn show dạng monospace nhỏ ở dưới để dev đối chiếu.
 */
const KEY_LABELS: Record<string, string> = {
	"chart.min_tests": "Số bài thi tối thiểu để hiện biểu đồ",
	"chart.sliding_window_size": "Số bài gần nhất dùng tính band",
	"chart.std_dev_threshold": "Ngưỡng loại bài bất thường (độ lệch chuẩn)",
	"streak.daily_goal": "Số bài luyện/ngày để giữ streak",
	"streak.timezone": "Múi giờ tính ngày streak",
	"streak.milestones": "Mốc thưởng xu theo streak",
	"grading.max_retries": "Số lần thử lại tối đa khi chấm bài",
	"exam.full_test_cost_coins": "Xu/lần thi Full VSTEP (4 kỹ năng)",
	"exam.custom_per_skill_coins": "Xu/kỹ năng khi thi Custom VSTEP",
	"support.level_costs": "Xu trừ khi bật gợi ý trong drill",
	"support.zalo_phone": "Số điện thoại Zalo hỗ trợ",
	"onboarding.initial_coins": "Xu tặng khi tạo profile đầu tiên",
	"profile.max_profiles_per_account": "Số hồ sơ tối đa mỗi tài khoản",
}

export function keyLabel(key: string): string {
	return KEY_LABELS[key] ?? key
}

/**
 * Mô tả chi tiết cho non-tech: giải thích WHAT/WHEN/WHY, không lặp lại tên.
 * Fallback về description từ BE nếu key chưa có override.
 */
const KEY_DESCRIPTIONS: Record<string, string> = {
	"chart.min_tests":
		"Biểu đồ điểm số (spider, line) chỉ xuất hiện sau khi học viên thi đủ số bài này. Đặt thấp → chart hiện sớm nhưng dễ sai lệch; đặt cao → chart đáng tin nhưng học viên phải đợi lâu.",
	"chart.sliding_window_size":
		"Khi tính band điểm gần đây, hệ thống chỉ lấy N bài thi mới nhất (cũ hơn bị bỏ). Tăng → mượt, ổn định. Giảm → phản ánh nhanh thay đổi gần đây.",
	"chart.std_dev_threshold":
		"Bài thi có điểm lệch quá N lần độ lệch chuẩn so với trung bình sẽ bị loại khỏi chart (coi là outlier). Tăng → giữ nhiều bài. Giảm → lọc gắt hơn.",
	"streak.daily_goal":
		"Mỗi ngày học viên phải hoàn thành ít nhất bấy nhiêu session drill thì streak mới được tính. Nhỏ → dễ giữ streak. Lớn → động lực cao hơn nhưng dễ mất.",
	"streak.timezone":
		"Hệ thống dùng timezone này để xác định thế nào là 'một ngày' khi reset streak (00:00 theo giờ Việt Nam mặc định).",
	"streak.milestones":
		"Danh sách mốc thưởng. Mỗi mốc gồm số ngày streak liên tục và số xu thưởng khi đạt. JSON dạng [{days, coins}, ...].",
	"grading.max_retries":
		"Khi job chấm bài (Writing/Speaking) lỗi (LLM timeout, Azure fail...), hệ thống tự retry tối đa số lần này trước khi bỏ cuộc và báo lỗi cho học viên.",
	"exam.full_test_cost_coins":
		"Số xu trừ trong ví khi học viên bắt đầu một đề thi Full VSTEP (đủ 4 kỹ năng Listening + Reading + Writing + Speaking).",
	"exam.custom_per_skill_coins":
		"Số xu trừ cho mỗi kỹ năng học viên chọn khi tạo đề Custom VSTEP. VD: chọn 2 kỹ năng → trừ 2 × giá trị này.",
	"support.level_costs":
		'Số xu trừ khi học viên bật mức gợi ý trong drill. JSON dạng {level: cost}. VD {"1": 1, "2": 2} = level 1 trừ 1 xu, level 2 trừ 2 xu.',
	"support.zalo_phone":
		"Số điện thoại dùng để mở chat Zalo khi học viên bấm nút hỗ trợ trên website. Nhập dạng số điện thoại, ví dụ 0343062376.",
	"onboarding.initial_coins":
		"Số xu hệ thống tự tặng vào ví khi học viên tạo profile đầu tiên (mỗi account chỉ nhận một lần duy nhất).",
	"profile.max_profiles_per_account":
		"Giới hạn số hồ sơ học tập mà một tài khoản học viên được tạo. Mỗi hồ sơ là một mục tiêu/lộ trình riêng; muốn đổi level mục tiêu thì tạo hồ sơ mới.",
}

export function keyDescription(key: string, fallback: string | null): string {
	return KEY_DESCRIPTIONS[key] ?? fallback ?? "—"
}
