import {
	ArrowRight01Icon,
	Book02Icon,
	BrainIcon,
	BulbIcon,
	CheckmarkCircle02Icon,
	RepeatIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

export interface SentenceItem {
	id: string
	sentence: string
	audioUrl: string
	translation: string
	explanation: string
	writingUsage: string
	difficulty: "easy" | "medium" | "hard"
}

export interface SentenceTopic {
	id: string
	name: string
	description: string
	sentenceCount: number
	icon: IconSvgElement
	sentences: SentenceItem[]
}

const OPINION_SENTENCES: SentenceItem[] = [
	{
		id: "op-1",
		sentence: "In my opinion, education plays a crucial role in shaping society.",
		audioUrl: "",
		translation:
			"Theo quan điểm của tôi, giáo dục đóng vai trò quan trọng trong việc định hình xã hội.",
		explanation:
			"Cấu trúc 'In my opinion, ...' dùng để mở đầu câu nêu quan điểm cá nhân. 'Play a crucial role in + V-ing' là cụm từ chỉ vai trò quan trọng của điều gì đó.",
		writingUsage:
			"Rất phù hợp cho Task 2 khi cần nêu quan điểm cá nhân ở phần mở bài hoặc thân bài. Dùng khi đề bài yêu cầu 'Do you agree or disagree?' hoặc 'What is your opinion?'.",
		difficulty: "easy",
	},
	{
		id: "op-2",
		sentence: "I strongly believe that technology has more advantages than disadvantages.",
		audioUrl: "",
		translation: "Tôi tin chắc rằng công nghệ có nhiều lợi ích hơn bất lợi.",
		explanation:
			"'I strongly believe that ...' thể hiện quan điểm mạnh mẽ. 'More ... than ...' là cấu trúc so sánh hơn dùng với danh từ.",
		writingUsage:
			"Dùng trong Task 2 để khẳng định lập trường rõ ràng. Phù hợp với dạng bài advantages/disadvantages hoặc opinion essay.",
		difficulty: "easy",
	},
	{
		id: "op-3",
		sentence: "From my perspective, environmental protection should be everyone's responsibility.",
		audioUrl: "",
		translation: "Từ góc nhìn của tôi, bảo vệ môi trường nên là trách nhiệm của mọi người.",
		explanation:
			"'From my perspective' là cách diễn đạt trang trọng hơn 'In my opinion'. 'Should be' dùng để đưa ra đề xuất hoặc ý kiến về điều nên làm.",
		writingUsage:
			"Thay thế cho 'In my opinion' để tránh lặp từ trong bài viết Task 2. Thể hiện sự đa dạng về ngôn ngữ, giúp tăng điểm từ vựng.",
		difficulty: "medium",
	},
	{
		id: "op-4",
		sentence: "It is widely acknowledged that regular exercise improves mental health.",
		audioUrl: "",
		translation:
			"Nhiều người thừa nhận rằng tập thể dục thường xuyên cải thiện sức khỏe tinh thần.",
		explanation:
			"'It is widely acknowledged that ...' là cấu trúc bị động dùng để nêu sự thật được nhiều người công nhận. Trang trọng và mang tính học thuật cao.",
		writingUsage:
			"Dùng trong Task 2 để mở đầu thân bài với luận điểm có tính thuyết phục. Phù hợp khi muốn dẫn dắt bằng sự thật được công nhận rộng rãi.",
		difficulty: "hard",
	},
	{
		id: "op-5",
		sentence: "I am of the view that the government should invest more in public transportation.",
		audioUrl: "",
		translation: "Tôi cho rằng chính phủ nên đầu tư nhiều hơn vào giao thông công cộng.",
		explanation:
			"'I am of the view that ...' là cách diễn đạt quan điểm rất trang trọng, thường dùng trong văn viết học thuật. 'Invest in' nghĩa là đầu tư vào.",
		writingUsage:
			"Dùng trong Task 2 khi cần nêu quan điểm ở mức độ trang trọng cao. Đặc biệt phù hợp với đề bài về chính sách xã hội.",
		difficulty: "hard",
	},
	{
		id: "op-6",
		sentence: "There is no doubt that globalization has transformed the way we live.",
		audioUrl: "",
		translation: "Không còn nghi ngờ gì nữa, toàn cầu hóa đã thay đổi cách chúng ta sống.",
		explanation:
			"'There is no doubt that ...' dùng để khẳng định điều gì đó chắc chắn đúng. 'Transform the way we live' nghĩa là thay đổi lối sống.",
		writingUsage:
			"Phù hợp cho cả Task 1 và Task 2 khi cần nhấn mạnh một xu hướng hoặc sự thật không thể phủ nhận. Thường dùng ở câu mở đầu đoạn.",
		difficulty: "medium",
	},
]

const CAUSE_EFFECT_SENTENCES: SentenceItem[] = [
	{
		id: "ce-1",
		sentence: "Due to rapid urbanization, many cities are facing serious traffic congestion.",
		audioUrl: "",
		translation:
			"Do quá trình đô thị hóa nhanh chóng, nhiều thành phố đang đối mặt với tắc nghẽn giao thông nghiêm trọng.",
		explanation:
			"'Due to + danh từ/cụm danh từ' dùng để chỉ nguyên nhân. 'Face' đi với vấn đề để diễn tả việc đối mặt với thách thức.",
		writingUsage:
			"Dùng trong Task 2 khi phân tích nguyên nhân của vấn đề. Rất phổ biến trong dạng bài causes and solutions.",
		difficulty: "easy",
	},
	{
		id: "ce-2",
		sentence: "The lack of physical activity leads to an increased risk of chronic diseases.",
		audioUrl: "",
		translation: "Việc thiếu vận động dẫn đến tăng nguy cơ mắc bệnh mãn tính.",
		explanation:
			"'The lack of ...' chỉ sự thiếu hụt. 'Lead to + danh từ' là cấu trúc chỉ kết quả. 'An increased risk of' là cụm từ học thuật phổ biến.",
		writingUsage:
			"Dùng trong Task 2 khi trình bày mối quan hệ nhân quả giữa lối sống và sức khỏe. Phù hợp với đề bài về health và lifestyle.",
		difficulty: "medium",
	},
	{
		id: "ce-3",
		sentence: "As a result of climate change, extreme weather events have become more frequent.",
		audioUrl: "",
		translation:
			"Do biến đổi khí hậu, các hiện tượng thời tiết cực đoan đã trở nên thường xuyên hơn.",
		explanation:
			"'As a result of + danh từ' chỉ nguyên nhân dẫn đến kết quả. 'Have become more frequent' dùng thì hiện tại hoàn thành để chỉ xu hướng kéo dài.",
		writingUsage:
			"Phù hợp cho Task 2 về chủ đề environment. Cũng dùng được trong Task 1 khi mô tả xu hướng thay đổi theo thời gian.",
		difficulty: "medium",
	},
	{
		id: "ce-4",
		sentence: "Because of the high cost of living, many young people struggle to afford housing.",
		audioUrl: "",
		translation: "Vì chi phí sinh hoạt cao, nhiều người trẻ gặp khó khăn trong việc chi trả nhà ở.",
		explanation:
			"'Because of + danh từ' chỉ nguyên nhân (khác 'because + mệnh đề'). 'Struggle to + V' diễn tả sự khó khăn khi làm gì.",
		writingUsage:
			"Dùng trong Task 2 khi thảo luận về vấn đề kinh tế xã hội. Phù hợp với dạng bài problem-solution về housing hoặc cost of living.",
		difficulty: "easy",
	},
	{
		id: "ce-5",
		sentence: "Consequently, the government has implemented stricter environmental regulations.",
		audioUrl: "",
		translation: "Do đó, chính phủ đã thực hiện các quy định môi trường nghiêm ngặt hơn.",
		explanation:
			"'Consequently' là trạng từ nối chỉ kết quả, đứng đầu câu và theo sau bởi dấu phẩy. 'Implement regulations' là collocation phổ biến.",
		writingUsage:
			"Dùng để nối hai câu có quan hệ nhân quả trong Task 2. Giúp bài viết mạch lạc và logic hơn, tăng điểm coherence.",
		difficulty: "hard",
	},
	{
		id: "ce-6",
		sentence: "This has resulted in a significant decline in biodiversity worldwide.",
		audioUrl: "",
		translation: "Điều này đã dẫn đến sự suy giảm đáng kể về đa dạng sinh học trên toàn thế giới.",
		explanation:
			"'Result in + danh từ' chỉ kết quả. 'A significant decline in' là cụm từ học thuật hay dùng trong bài viết. 'Worldwide' là trạng từ bổ nghĩa cho toàn câu.",
		writingUsage:
			"Dùng trong Task 2 để trình bày hậu quả của vấn đề. Cũng phù hợp trong Task 1 khi mô tả xu hướng giảm trong biểu đồ.",
		difficulty: "hard",
	},
]

const COMPARISON_SENTENCES: SentenceItem[] = [
	{
		id: "cmp-1",
		sentence:
			"While some people prefer working from home, others find it more productive to work in an office.",
		audioUrl: "",
		translation:
			"Trong khi một số người thích làm việc tại nhà, những người khác thấy làm việc tại văn phòng năng suất hơn.",
		explanation:
			"'While ... , others ...' là cấu trúc đối chiếu hai quan điểm trái ngược. 'Find it + adj + to V' là cấu trúc dùng 'it' làm tân ngữ giả.",
		writingUsage:
			"Rất phù hợp cho Task 2 dạng discuss both views. Dùng ở đầu thân bài để trình bày hai quan điểm đối lập.",
		difficulty: "medium",
	},
	{
		id: "cmp-2",
		sentence:
			"Unlike traditional education, online learning offers greater flexibility in scheduling.",
		audioUrl: "",
		translation:
			"Khác với giáo dục truyền thống, học trực tuyến mang lại sự linh hoạt hơn về thời gian.",
		explanation:
			"'Unlike + danh từ' dùng để so sánh sự khác biệt. 'Offer greater flexibility in' là cụm từ chỉ lợi thế về tính linh hoạt.",
		writingUsage:
			"Dùng trong Task 2 khi so sánh hai phương pháp, hệ thống hoặc cách tiếp cận. Thường xuất hiện trong dạng bài compare and contrast.",
		difficulty: "easy",
	},
	{
		id: "cmp-3",
		sentence: "Compared to rural areas, urban regions have better access to healthcare facilities.",
		audioUrl: "",
		translation:
			"So với vùng nông thôn, các khu vực thành thị có khả năng tiếp cận cơ sở y tế tốt hơn.",
		explanation:
			"'Compared to + danh từ' là cụm từ mở đầu so sánh. 'Have better access to' nghĩa là có khả năng tiếp cận tốt hơn.",
		writingUsage:
			"Phù hợp cho Task 2 khi so sánh hai đối tượng. Cũng dùng được trong Task 1 khi so sánh dữ liệu giữa các nhóm.",
		difficulty: "easy",
	},
	{
		id: "cmp-4",
		sentence:
			"On the one hand, technology enhances communication; on the other hand, it reduces face-to-face interaction.",
		audioUrl: "",
		translation:
			"Một mặt, công nghệ tăng cường giao tiếp; mặt khác, nó làm giảm tương tác trực tiếp.",
		explanation:
			"'On the one hand ... on the other hand ...' là cấu trúc kinh điển để trình bày hai mặt của vấn đề. Dùng dấu chấm phẩy để nối hai mệnh đề.",
		writingUsage:
			"Rất quan trọng trong Task 2 dạng advantages/disadvantages. Giúp trình bày cả hai mặt của vấn đề một cách cân bằng.",
		difficulty: "medium",
	},
	{
		id: "cmp-5",
		sentence:
			"Although public transport is more environmentally friendly, private vehicles offer greater convenience.",
		audioUrl: "",
		translation:
			"Mặc dù phương tiện công cộng thân thiện với môi trường hơn, phương tiện cá nhân mang lại sự tiện lợi hơn.",
		explanation:
			"'Although + mệnh đề' dùng để nhượng bộ trước khi đưa ra ý chính. 'More environmentally friendly' là so sánh hơn với tính từ dài.",
		writingUsage:
			"Dùng trong Task 2 khi cần thừa nhận mặt tích cực của đối tượng trước khi phản bác. Thể hiện tư duy phản biện tốt.",
		difficulty: "medium",
	},
	{
		id: "cmp-6",
		sentence:
			"In contrast to developed countries, developing nations face greater challenges in education.",
		audioUrl: "",
		translation:
			"Trái ngược với các nước phát triển, các quốc gia đang phát triển đối mặt với nhiều thách thức hơn trong giáo dục.",
		explanation:
			"'In contrast to + danh từ' dùng để chỉ sự tương phản rõ rệt. 'Face greater challenges in' là cụm từ chỉ thách thức lớn hơn.",
		writingUsage:
			"Phù hợp cho Task 2 khi so sánh giữa các quốc gia hoặc nhóm đối tượng. Thể hiện kiến thức xã hội rộng.",
		difficulty: "hard",
	},
]

const CONCLUSION_SENTENCES: SentenceItem[] = [
	{
		id: "con-1",
		sentence: "In conclusion, the benefits of higher education far outweigh its costs.",
		audioUrl: "",
		translation: "Tóm lại, lợi ích của giáo dục đại học vượt trội hơn nhiều so với chi phí.",
		explanation:
			"'In conclusion' là cụm từ mở đầu đoạn kết luận. 'Far outweigh' nghĩa là vượt trội hơn rất nhiều, dùng khi so sánh lợi ích và bất lợi.",
		writingUsage:
			"Dùng ở đoạn cuối Task 2 để tổng kết bài viết. Đây là cách mở đầu kết luận phổ biến và an toàn nhất.",
		difficulty: "easy",
	},
	{
		id: "con-2",
		sentence: "To sum up, a balanced approach is needed to address environmental challenges.",
		audioUrl: "",
		translation:
			"Tóm lại, cần có cách tiếp cận cân bằng để giải quyết các thách thức về môi trường.",
		explanation:
			"'To sum up' tương đương 'In conclusion' nhưng ngắn gọn hơn. 'A balanced approach is needed' dùng cấu trúc bị động để nhấn mạnh giải pháp.",
		writingUsage:
			"Thay thế cho 'In conclusion' để tránh lặp từ. Phù hợp khi kết luận bài Task 2 dạng problem-solution.",
		difficulty: "easy",
	},
	{
		id: "con-3",
		sentence: "All things considered, technology has significantly improved our quality of life.",
		audioUrl: "",
		translation:
			"Xét về mọi mặt, công nghệ đã cải thiện đáng kể chất lượng cuộc sống của chúng ta.",
		explanation:
			"'All things considered' là cụm phân từ chỉ sự cân nhắc toàn diện. 'Significantly improved' dùng trạng từ để nhấn mạnh mức độ thay đổi.",
		writingUsage:
			"Dùng trong Task 2 khi đã phân tích nhiều khía cạnh và muốn đưa ra kết luận tổng quan. Thể hiện trình độ từ vựng cao.",
		difficulty: "medium",
	},
	{
		id: "con-4",
		sentence:
			"Taking everything into account, stricter regulations are necessary to protect public health.",
		audioUrl: "",
		translation:
			"Xem xét tất cả các yếu tố, các quy định nghiêm ngặt hơn là cần thiết để bảo vệ sức khỏe cộng đồng.",
		explanation:
			"'Taking everything into account' là cách diễn đạt trang trọng cho kết luận. 'Stricter regulations are necessary' dùng tính từ so sánh hơn với cấu trúc 'be necessary'.",
		writingUsage:
			"Phù hợp cho Task 2 khi kết luận bằng đề xuất giải pháp. Thường dùng trong dạng bài về chính sách công.",
		difficulty: "hard",
	},
	{
		id: "con-5",
		sentence: "Overall, it is clear that sustainable development requires collective effort.",
		audioUrl: "",
		translation: "Nhìn chung, rõ ràng rằng phát triển bền vững đòi hỏi nỗ lực tập thể.",
		explanation:
			"'Overall' là trạng từ tổng kết. 'It is clear that ...' là cấu trúc nhấn mạnh sự rõ ràng. 'Require collective effort' nghĩa là cần nỗ lực chung.",
		writingUsage:
			"Dùng ở đoạn kết Task 2 để đưa ra nhận định cuối cùng. Ngắn gọn nhưng đầy đủ, phù hợp với mọi dạng bài.",
		difficulty: "medium",
	},
	{
		id: "con-6",
		sentence:
			"In summary, both individual and governmental actions are essential for social progress.",
		audioUrl: "",
		translation:
			"Tóm tắt lại, cả hành động cá nhân lẫn chính phủ đều thiết yếu cho sự tiến bộ xã hội.",
		explanation:
			"'In summary' dùng để tóm tắt toàn bộ bài viết. 'Both ... and ...' là cấu trúc liên kết hai chủ ngữ. 'Be essential for' nghĩa là thiết yếu cho.",
		writingUsage:
			"Dùng trong Task 2 để kết hợp hai giải pháp hoặc hai quan điểm ở phần kết luận. Thể hiện tư duy toàn diện.",
		difficulty: "medium",
	},
]

const PROBLEM_SOLUTION_SENTENCES: SentenceItem[] = [
	{
		id: "ps-1",
		sentence:
			"One of the most pressing issues today is the growing gap between the rich and the poor.",
		audioUrl: "",
		translation:
			"Một trong những vấn đề cấp bách nhất hiện nay là khoảng cách ngày càng tăng giữa người giàu và người nghèo.",
		explanation:
			"'One of the most + tính từ + danh từ số nhiều' là cấu trúc so sánh nhất. 'The growing gap between' dùng tính từ hiện tại phân từ để chỉ xu hướng tăng.",
		writingUsage:
			"Dùng ở đầu Task 2 để giới thiệu vấn đề cần thảo luận. Rất phù hợp với dạng bài problem-solution.",
		difficulty: "easy",
	},
	{
		id: "ps-2",
		sentence:
			"A possible solution to traffic congestion is to invest in efficient public transport systems.",
		audioUrl: "",
		translation:
			"Một giải pháp khả thi cho tắc nghẽn giao thông là đầu tư vào hệ thống giao thông công cộng hiệu quả.",
		explanation:
			"'A possible solution to + vấn đề + is to V' là mẫu câu đề xuất giải pháp. 'Invest in' đi với lĩnh vực đầu tư.",
		writingUsage:
			"Dùng trong thân bài Task 2 dạng problem-solution. Mỗi đoạn có thể bắt đầu bằng một giải pháp theo mẫu này.",
		difficulty: "easy",
	},
	{
		id: "ps-3",
		sentence:
			"To tackle the problem of air pollution, governments should promote the use of renewable energy.",
		audioUrl: "",
		translation:
			"Để giải quyết vấn đề ô nhiễm không khí, chính phủ nên thúc đẩy việc sử dụng năng lượng tái tạo.",
		explanation:
			"'To tackle the problem of + danh từ' là cụm từ mở đầu giải pháp. 'Promote the use of' nghĩa là khuyến khích sử dụng.",
		writingUsage:
			"Phù hợp cho Task 2 khi trình bày giải pháp cho vấn đề môi trường. Cấu trúc mục đích 'To + V' ở đầu câu tạo sự mạch lạc.",
		difficulty: "medium",
	},
	{
		id: "ps-4",
		sentence: "The issue of food insecurity can be addressed by improving agricultural practices.",
		audioUrl: "",
		translation:
			"Vấn đề mất an ninh lương thực có thể được giải quyết bằng cách cải thiện các phương pháp nông nghiệp.",
		explanation:
			"'Can be addressed by + V-ing' là cấu trúc bị động chỉ cách giải quyết. 'The issue of' là cách nêu vấn đề trang trọng.",
		writingUsage:
			"Dùng trong Task 2 dạng problem-solution. Cấu trúc bị động giúp câu mang tính khách quan và học thuật hơn.",
		difficulty: "medium",
	},
	{
		id: "ps-5",
		sentence: "In order to reduce unemployment, vocational training programs should be expanded.",
		audioUrl: "",
		translation: "Để giảm thất nghiệp, các chương trình đào tạo nghề nên được mở rộng.",
		explanation:
			"'In order to + V' chỉ mục đích, trang trọng hơn 'to + V'. 'Should be expanded' dùng bị động với 'should' để đề xuất giải pháp.",
		writingUsage:
			"Phù hợp cho Task 2 khi đề xuất giải pháp cụ thể. Cấu trúc 'In order to' thể hiện mục đích rõ ràng, logic.",
		difficulty: "hard",
	},
	{
		id: "ps-6",
		sentence:
			"This problem could be mitigated by raising public awareness through education campaigns.",
		audioUrl: "",
		translation:
			"Vấn đề này có thể được giảm thiểu bằng cách nâng cao nhận thức cộng đồng thông qua các chiến dịch giáo dục.",
		explanation:
			"'Could be mitigated by + V-ing' dùng bị động với 'could' để đề xuất khả năng. 'Raise public awareness through' là collocation phổ biến.",
		writingUsage:
			"Dùng trong Task 2 khi cần đề xuất giải pháp mềm (nâng cao nhận thức). Từ 'mitigate' nâng cao điểm từ vựng so với 'reduce' hay 'solve'.",
		difficulty: "hard",
	},
]

const EXAMPLE_EVIDENCE_SENTENCES: SentenceItem[] = [
	{
		id: "ev-1",
		sentence:
			"For example, countries like Finland have achieved excellent educational outcomes through student-centered approaches.",
		audioUrl: "",
		translation:
			"Ví dụ, các quốc gia như Phần Lan đã đạt được kết quả giáo dục xuất sắc thông qua cách tiếp cận lấy học sinh làm trung tâm.",
		explanation:
			"'For example' mở đầu câu dẫn chứng cụ thể. 'Countries like + tên nước' dùng để nêu ví dụ thực tế. 'Through + danh từ' chỉ phương tiện.",
		writingUsage:
			"Dùng trong thân bài Task 2 sau khi nêu luận điểm. Ví dụ cụ thể từ thực tế giúp tăng tính thuyết phục.",
		difficulty: "easy",
	},
	{
		id: "ev-2",
		sentence:
			"Research has shown that regular physical activity reduces the risk of heart disease by up to 50 percent.",
		audioUrl: "",
		translation:
			"Nghiên cứu đã chỉ ra rằng hoạt động thể chất thường xuyên giảm nguy cơ mắc bệnh tim lên đến 50 phần trăm.",
		explanation:
			"'Research has shown that ...' là cách dẫn nguồn trong văn học thuật. 'Reduce the risk of ... by + số %' là cấu trúc chỉ mức giảm.",
		writingUsage:
			"Rất phù hợp cho Task 2 khi cần dẫn chứng khoa học. Dùng số liệu cụ thể tăng tính thuyết phục cho bài viết.",
		difficulty: "medium",
	},
	{
		id: "ev-3",
		sentence:
			"A notable example of this is the rapid development of renewable energy in Scandinavian countries.",
		audioUrl: "",
		translation:
			"Một ví dụ đáng chú ý về điều này là sự phát triển nhanh chóng của năng lượng tái tạo ở các nước Bắc Âu.",
		explanation:
			"'A notable example of this is ...' là cách giới thiệu ví dụ nổi bật. 'The rapid development of' dùng tính từ trước danh từ để mô tả tốc độ.",
		writingUsage:
			"Dùng trong Task 2 để minh họa luận điểm bằng ví dụ cụ thể. Cấu trúc trang trọng giúp bài viết mang tính học thuật.",
		difficulty: "medium",
	},
	{
		id: "ev-4",
		sentence:
			"According to a recent survey, over 70 percent of employees prefer flexible working arrangements.",
		audioUrl: "",
		translation:
			"Theo một khảo sát gần đây, hơn 70 phần trăm nhân viên thích các hình thức làm việc linh hoạt.",
		explanation:
			"'According to + nguồn' dùng để trích dẫn thông tin. 'A recent survey' là nguồn phổ biến trong bài viết. 'Over + số %' chỉ tỷ lệ.",
		writingUsage:
			"Rất hữu ích trong Task 2 khi cần dẫn chứng bằng số liệu thống kê. Cũng dùng được trong Task 1 khi mô tả dữ liệu.",
		difficulty: "easy",
	},
	{
		id: "ev-5",
		sentence: "This is clearly illustrated by the success of Singapore's public housing program.",
		audioUrl: "",
		translation:
			"Điều này được minh họa rõ ràng qua sự thành công của chương trình nhà ở công cộng của Singapore.",
		explanation:
			"'This is clearly illustrated by ...' là cấu trúc bị động dùng để minh họa. Nối với câu trước để cung cấp bằng chứng cho luận điểm đã nêu.",
		writingUsage:
			"Dùng trong Task 2 để chứng minh luận điểm vừa trình bày. Cấu trúc bị động thể hiện tính học thuật cao.",
		difficulty: "hard",
	},
	{
		id: "ev-6",
		sentence:
			"Evidence suggests that bilingual children develop stronger cognitive abilities than monolingual peers.",
		audioUrl: "",
		translation:
			"Bằng chứng cho thấy trẻ em song ngữ phát triển khả năng nhận thức mạnh hơn so với các bạn đồng lứa đơn ngữ.",
		explanation:
			"'Evidence suggests that ...' là cách dẫn chứng khoa học trang trọng. 'Develop stronger ... than ...' dùng so sánh hơn với tính từ.",
		writingUsage:
			"Phù hợp cho Task 2 khi thảo luận về giáo dục hoặc phát triển trẻ em. Dùng 'evidence suggests' thay vì khẳng định trực tiếp thể hiện tính khách quan.",
		difficulty: "hard",
	},
]

export const SENTENCE_TOPICS: SentenceTopic[] = [
	{
		id: "opinion-expressions",
		name: "Câu diễn đạt quan điểm",
		description: "Các mẫu câu nêu ý kiến, quan điểm cá nhân trong bài viết.",
		sentenceCount: OPINION_SENTENCES.length,
		icon: BulbIcon,
		sentences: OPINION_SENTENCES,
	},
	{
		id: "cause-effect",
		name: "Câu nguyên nhân – kết quả",
		description: "Các mẫu câu diễn đạt mối quan hệ nhân quả.",
		sentenceCount: CAUSE_EFFECT_SENTENCES.length,
		icon: ArrowRight01Icon,
		sentences: CAUSE_EFFECT_SENTENCES,
	},
	{
		id: "comparison",
		name: "Câu so sánh – đối chiếu",
		description: "Các mẫu câu so sánh, đối chiếu hai đối tượng hoặc quan điểm.",
		sentenceCount: COMPARISON_SENTENCES.length,
		icon: RepeatIcon,
		sentences: COMPARISON_SENTENCES,
	},
	{
		id: "conclusion",
		name: "Câu tổng kết – kết luận",
		description: "Các mẫu câu dùng để kết luận, tổng kết bài viết.",
		sentenceCount: CONCLUSION_SENTENCES.length,
		icon: CheckmarkCircle02Icon,
		sentences: CONCLUSION_SENTENCES,
	},
	{
		id: "problem-solution",
		name: "Câu vấn đề – giải pháp",
		description: "Các mẫu câu nêu vấn đề và đề xuất giải pháp.",
		sentenceCount: PROBLEM_SOLUTION_SENTENCES.length,
		icon: BrainIcon,
		sentences: PROBLEM_SOLUTION_SENTENCES,
	},
	{
		id: "example-evidence",
		name: "Câu dẫn chứng – ví dụ",
		description: "Các mẫu câu dẫn chứng, ví dụ minh họa cho luận điểm.",
		sentenceCount: EXAMPLE_EVIDENCE_SENTENCES.length,
		icon: Book02Icon,
		sentences: EXAMPLE_EVIDENCE_SENTENCES,
	},
]

export function getSentenceTopic(topicId: string): SentenceTopic | undefined {
	return SENTENCE_TOPICS.find((t) => t.id === topicId)
}
