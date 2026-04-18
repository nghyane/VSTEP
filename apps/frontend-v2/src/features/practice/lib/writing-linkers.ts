// Từ nối theo chức năng dùng chung cho mọi đề viết.
// User đọc tham khảo; click để copy vào clipboard (kèm toast ở caller).

export interface LinkerGroup {
	readonly label: string
	readonly phrases: readonly string[]
}

export const WRITING_LINKERS: readonly LinkerGroup[] = [
	{
		label: "Mở đầu / Nêu quan điểm",
		phrases: [
			"In my opinion,",
			"From my perspective,",
			"I strongly believe that",
			"It seems to me that",
		],
	},
	{
		label: "Bổ sung ý",
		phrases: ["Furthermore,", "Moreover,", "In addition,", "Besides that,", "What is more,"],
	},
	{
		label: "Đưa ví dụ",
		phrases: ["For instance,", "For example,", "A good example of this is", "To illustrate,"],
	},
	{
		label: "Nhượng bộ / Phản biện",
		phrases: [
			"However,",
			"Nevertheless,",
			"On the other hand,",
			"Even though",
			"Despite the fact that",
		],
	},
	{
		label: "Nguyên nhân - kết quả",
		phrases: ["As a result,", "Therefore,", "Consequently,", "This leads to", "Because of this,"],
	},
	{
		label: "Kết luận",
		phrases: ["In conclusion,", "To sum up,", "All things considered,", "Overall,", "In short,"],
	},
] as const
