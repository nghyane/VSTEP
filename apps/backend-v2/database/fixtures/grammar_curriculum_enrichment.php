<?php

declare(strict_types=1);

/**
 * Authored learning content keyed by grammar point slug.
 *
 * @return array<string, array{
 *     examples: list<array{string, string, string}>,
 *     mistake: array{string, string, string},
 *     tip: string
 * }>
 */
return [
    'a1-be-subject-pronouns' => [
        'examples' => [['I am ready for class.', 'Tôi đã sẵn sàng cho buổi học.', 'Dùng am với I.'], ['They are my classmates.', 'Họ là bạn cùng lớp của tôi.', 'Dùng are với chủ ngữ số nhiều.']],
        'mistake' => ['I is tired today.', 'I am tired today.', 'Đại từ I luôn đi với am ở hiện tại.'],
        'tip' => 'Trong phần giới thiệu bản thân, kiểm tra am/is/are ngay sau chủ ngữ.',
    ],
    'a1-have-possessives' => [
        'examples' => [['I have two sisters.', 'Tôi có hai chị em gái.', 'Have đi với I.'], ['Her father has a small shop.', 'Bố của cô ấy có một cửa hàng nhỏ.', 'Has đi với chủ ngữ số ít.']],
        'mistake' => ['She have a blue bag.', 'She has a blue bag.', 'He, she, it cần has thay cho have.'],
        'tip' => 'Khi mô tả gia đình, đối chiếu chủ ngữ trước khi chọn have hoặc has.',
    ],
    'a1-present-simple' => [
        'examples' => [['I walk to school every day.', 'Tôi đi bộ đến trường mỗi ngày.', 'Thói quen với I dùng động từ nguyên mẫu.'], ['My mother cooks dinner at six.', 'Mẹ tôi nấu bữa tối lúc sáu giờ.', 'Chủ ngữ số ít nhận đuôi -s.']],
        'mistake' => ['Anna go to bed early.', 'Anna goes to bed early.', 'Tên một người là chủ ngữ số ít nên động từ thêm -s/-es.'],
        'tip' => 'Trong câu nói về routine, tìm he/she/it trước khi hoàn tất động từ.',
    ],
    'a1-there-is-are' => [
        'examples' => [['There is a desk in my room.', 'Có một cái bàn trong phòng tôi.', 'There is giới thiệu danh từ số ít.'], ['There are three students outside.', 'Có ba học sinh ở bên ngoài.', 'There are giới thiệu danh từ số nhiều.']],
        'mistake' => ['There are a hospital nearby.', 'There is a hospital nearby.', 'A hospital là số ít nên dùng is.'],
        'tip' => 'Nhìn danh từ ngay sau cấu trúc để chọn is hoặc are trong phần mô tả tranh.',
    ],
    'a1-basic-questions' => [
        'examples' => [['What is your name?', 'Tên bạn là gì?', 'Hỏi danh tính với be.'], ['Does your brother play football?', 'Anh trai bạn có chơi bóng đá không?', 'Does đưa động từ về dạng nguyên mẫu.']],
        'mistake' => ['Does she studies English?', 'Does she study English?', 'Sau does dùng base verb, không dùng động từ thêm -s.'],
        'tip' => 'Khi hỏi về thói quen, đặt do/does trước chủ ngữ và giữ động từ nguyên mẫu.',
    ],
    'a1-prepositions-place-time' => [
        'examples' => [['I study in the library.', 'Tôi học trong thư viện.', 'In dùng cho không gian bên trong.'], ['We meet on Friday at nine.', 'Chúng tôi gặp nhau vào thứ Sáu lúc chín giờ.', 'On dùng cho ngày; at dùng cho giờ.']],
        'mistake' => ['The class is on 8:30.', 'The class is at 8:30.', 'Giờ cụ thể đi với at.'],
        'tip' => 'Trong câu lịch trình, rà lại ba tín hiệu: giờ dùng at, ngày dùng on, tháng/năm dùng in.',
    ],
    'a1-articles' => [
        'examples' => [['I saw a cat in the garden.', 'Tôi thấy một con mèo trong vườn.', 'A giới thiệu danh từ lần đầu.'], ['The cat was sleeping under a tree.', 'Con mèo đang ngủ dưới gốc cây.', 'The chỉ con mèo đã nhắc trước đó.']],
        'mistake' => ['She is a honest person.', 'She is an honest person.', 'Honest bắt đầu bằng nguyên âm /ɒ/ nên dùng an.'],
        'tip' => 'Chọn a/an theo âm đầu tiên (không phải chữ cái đầu). Dùng the khi cả người nói và nghe đều biết đang nói về cái gì.',
    ],
    'a1-subject-verb-agreement' => [
        'examples' => [['The price of these books is high.', 'Giá của những cuốn sách này cao.', 'Chủ ngữ chính là price (số ít).'], ['My friends live near the school.', 'Bạn bè tôi sống gần trường.', 'Friends là số nhiều nên dùng live.']],
        'mistake' => ['The list of items are ready.', 'The list of items is ready.', 'Chủ ngữ chính là list (số ít), không phải items.'],
        'tip' => 'Tìm chủ ngữ chính (trước giới từ of/in/with) để chia động từ đúng.',
    ],
    'a2-past-simple' => [
        'examples' => [['She bought a book yesterday.', 'Cô ấy đã mua một cuốn sách hôm qua.', 'Động từ bất quy tắc ở quá khứ.'], ['Did you visit the museum last week?', 'Bạn đã thăm bảo tàng tuần trước chưa?', 'Sau did dùng base verb.']],
        'mistake' => ['We did not went out last night.', 'We did not go out last night.', 'Did not đã mang nghĩa quá khứ nên động từ sau nó ở dạng nguyên mẫu.'],
        'tip' => 'Trong bài kể lại, đánh dấu time marker như yesterday hoặc last week để duy trì past simple.',
    ],
    'a2-present-continuous' => [
        'examples' => [['I am waiting for the bus now.', 'Tôi đang chờ xe buýt lúc này.', 'Hành động diễn ra ngay lúc nói.'], ['She is staying with her aunt this month.', 'Cô ấy đang ở với dì trong tháng này.', 'Tình huống tạm thời.']],
        'mistake' => ['He is play football now.', 'He is playing football now.', 'Sau be trong hiện tại tiếp diễn phải dùng V-ing.'],
        'tip' => 'Dùng present continuous khi câu có now, at the moment hoặc một hoàn cảnh tạm thời.',
    ],
    'a2-past-continuous' => [
        'examples' => [['She was reading when I called.', 'Cô ấy đang đọc sách khi tôi gọi.', 'Hành động đang diễn ra bị ngắt bởi sự kiện khác.'], ['While they were walking, it started to rain.', 'Trong khi họ đang đi bộ, trời bắt đầu mưa.', 'While + past continuous cho bối cảnh.']],
        'mistake' => ['I was watch TV when the power went out.', 'I was watching TV when the power went out.', 'Sau was/were phải dùng V-ing.'],
        'tip' => 'Dùng past continuous cho bối cảnh đang diễn ra, past simple cho sự kiện ngắt vào.',
    ],
    'a2-future-plans' => [
        'examples' => [['We are going to travel in June.', 'Chúng tôi định đi du lịch vào tháng Sáu.', 'Kế hoạch đã có ý định.'], ['I am meeting my tutor tomorrow.', 'Tôi sẽ gặp gia sư vào ngày mai.', 'Arrangement đã được sắp xếp.']],
        'mistake' => ['She is going apply for the job.', 'She is going to apply for the job.', 'Cấu trúc going to cần giới từ to trước động từ.'],
        'tip' => 'Trong phần nói về kế hoạch, dùng going to cho ý định và present continuous cho lịch đã sắp.',
    ],
    'a2-future-simple' => [
        'examples' => [['I will help you with your homework.', 'Tôi sẽ giúp bạn làm bài tập.', 'Will cho quyết định tức thời.'], ['It will probably be sunny tomorrow.', 'Ngày mai có lẽ trời sẽ nắng.', 'Will cho dự đoán.']],
        'mistake' => ['I will to call you later.', 'I will call you later.', 'Sau will dùng base verb, không có to.'],
        'tip' => 'Phân biệt: going to cho kế hoạch đã có, will cho quyết định ngay lúc nói hoặc dự đoán.',
    ],
    'a2-countability-quantifiers' => [
        'examples' => [['I need some information.', 'Tôi cần một ít thông tin.', 'Information là không đếm được.'], ['How many students joined the club?', 'Có bao nhiêu học sinh tham gia câu lạc bộ?', 'Many dùng với danh từ đếm được số nhiều.']],
        'mistake' => ['She gave me many advice.', 'She gave me some advice.', 'Advice là danh từ không đếm được nên không đi với many.'],
        'tip' => 'Trước khi chọn much hoặc many, xác định danh từ có thể đếm từng đơn vị hay không.',
    ],
    'a2-comparatives-superlatives' => [
        'examples' => [['This room is quieter than the hall.', 'Phòng này yên tĩnh hơn hội trường.', 'Tính từ ngắn dùng -er.'], ['It is the most convenient option.', 'Đó là lựa chọn thuận tiện nhất.', 'Tính từ dài dùng the most.']],
        'mistake' => ['This exam is difficulter than the last one.', 'This exam is more difficult than the last one.', 'Difficult là tính từ dài nên dùng more.'],
        'tip' => 'Trong phần so sánh lựa chọn, kiểm tra tính từ ngắn hay dài trước khi dùng -er hoặc more.',
    ],
    'a2-basic-modals' => [
        'examples' => [['You can borrow my dictionary.', 'Bạn có thể mượn từ điển của tôi.', 'Can chỉ khả năng hoặc sự cho phép.'], ['Visitors must wear a badge.', 'Khách tham quan phải đeo thẻ.', 'Must biểu thị nghĩa vụ.']],
        'mistake' => ['You must to bring your ID.', 'You must bring your ID.', 'Sau modal verb luôn dùng động từ nguyên mẫu không có to.'],
        'tip' => 'Khi đưa lời khuyên ở Speaking, đặt should trực tiếp trước động từ chính.',
    ],
    'a2-tag-questions' => [
        'examples' => [['It is cold today, isn\'t it?', 'Hôm nay lạnh, phải không?', 'Câu khẳng định dùng tag phủ định.'], ['They haven\'t finished, have they?', 'Họ chưa xong, phải không?', 'Câu phủ định dùng tag khẳng định.']],
        'mistake' => ['She likes coffee, doesn\'t she likes?', 'She likes coffee, doesn\'t she?', 'Tag question chỉ cần trợ động từ + đại từ, không lặp lại động từ chính.'],
        'tip' => 'Tag question dùng trợ động từ ngược dấu với mệnh đề chính và đại từ thay cho chủ ngữ.',
    ],
    'b1-present-perfect' => [
        'examples' => [['She has lived here since 2020.', 'Cô ấy đã sống ở đây từ năm 2020.', 'Since nêu mốc bắt đầu.'], ['Have you ever taken an online course?', 'Bạn đã từng học khóa trực tuyến chưa?', 'Ever hỏi trải nghiệm đến hiện tại.']],
        'mistake' => ['I have seen him yesterday.', 'I saw him yesterday.', 'Yesterday là thời điểm quá khứ đã kết thúc nên dùng past simple.'],
        'tip' => 'Dùng present perfect cho experience hoặc kết quả liên quan hiện tại; tránh dùng với mốc quá khứ kết thúc.',
    ],
    'b1-present-perfect-continuous' => [
        'examples' => [['I have been waiting for an hour.', 'Tôi đã chờ được một tiếng rồi.', 'Nhấn mạnh thời gian kéo dài.'], ['He has been working here since January.', 'Anh ấy đã làm việc ở đây từ tháng Giêng.', 'Since cho mốc bắt đầu, hành động vẫn tiếp tục.']],
        'mistake' => ['She has been know him for years.', 'She has known him for years.', 'Know là stative verb, không dùng ở dạng continuous.'],
        'tip' => 'Dùng present perfect continuous khi muốn nhấn mạnh quá trình kéo dài; dùng present perfect simple khi nhấn kết quả.',
    ],
    'b1-past-perfect' => [
        'examples' => [['She had left before I arrived.', 'Cô ấy đã rời đi trước khi tôi đến.', 'Had + V3 cho hành động xảy ra trước.'], ['After they had eaten, they went for a walk.', 'Sau khi ăn xong, họ đi dạo.', 'After + past perfect, past simple.']],
        'mistake' => ['When I got there, the show already started.', 'When I got there, the show had already started.', 'Hành động xảy ra trước cần past perfect để phân biệt thứ tự.'],
        'tip' => 'Dùng past perfect khi cần làm rõ hành động nào xảy ra trước trong câu kể quá khứ.',
    ],
    'b1-passive-basics' => [
        'examples' => [['The emails are checked every morning.', 'Các email được kiểm tra mỗi sáng.', 'Bị động hiện tại cho quy trình.'], ['The bridge was repaired last year.', 'Cây cầu được sửa năm ngoái.', 'Bị động quá khứ cho việc đã hoàn tất.']],
        'mistake' => ['The report was submit yesterday.', 'The report was submitted yesterday.', 'Sau be trong bị động cần past participle.'],
        'tip' => 'Trong Writing, dùng passive khi kết quả hoặc quy trình quan trọng hơn người thực hiện.',
    ],
    'b1-first-second-conditionals' => [
        'examples' => [['If it rains, we will cancel the picnic.', 'Nếu trời mưa, chúng tôi sẽ hủy buổi dã ngoại.', 'Điều kiện có thể xảy ra.'], ['If I had more time, I would volunteer.', 'Nếu tôi có nhiều thời gian hơn, tôi sẽ làm tình nguyện.', 'Giả định hiện tại.']],
        'mistake' => ['If people recycle more, pollution would decrease.', 'If people recycled more, pollution would decrease.', 'Mệnh đề would trong second conditional đi với past simple ở mệnh đề if.'],
        'tip' => 'Chọn first conditional cho giải pháp khả thi; chọn second conditional cho giả định hoặc đề xuất xa thực tế.',
    ],
    'b1-relative-clauses' => [
        'examples' => [['The teacher who helped me is retiring.', 'Giáo viên đã giúp tôi sắp nghỉ hưu.', 'Who thay cho người.'], ['This is the laptop that I bought online.', 'Đây là chiếc laptop tôi mua trực tuyến.', 'That thay cho vật.']],
        'mistake' => ['The student which won the prize is my friend.', 'The student who won the prize is my friend.', 'Dùng who, không dùng which, khi antecedent là người.'],
        'tip' => 'Dùng relative clause để thêm chi tiết mà không tách câu, nhưng chọn đúng đại từ theo danh từ.',
    ],
    'b1-reported-speech' => [
        'examples' => [['She said that the meeting was cancelled.', 'Cô ấy nói cuộc họp đã bị hủy.', 'Said không cần tân ngữ người nghe.'], ['My tutor told me to revise daily.', 'Gia sư bảo tôi ôn mỗi ngày.', 'Told cần tân ngữ.']],
        'mistake' => ['He told that he was busy.', 'He said that he was busy.', 'Nếu không nêu người được nói với, dùng said.'],
        'tip' => 'Trong bài tường thuật, dùng said that cho thông tin và told someone to cho lời hướng dẫn.',
    ],
    'b1-gerunds-infinitives' => [
        'examples' => [['I enjoy reading before bed.', 'Tôi thích đọc sách trước khi ngủ.', 'Enjoy + V-ing.'], ['They agreed to help with the project.', 'Họ đồng ý giúp dự án.', 'Agree + to-V.']],
        'mistake' => ['She avoids to speak in public.', 'She avoids speaking in public.', 'Avoid luôn đi với V-ing, không dùng to-V.'],
        'tip' => 'Học thuộc nhóm: enjoy/avoid/suggest + V-ing; want/decide/agree + to-V. Khi không chắc, tra từ điển.',
    ],
    'b1-linking-clauses' => [
        'examples' => [['Because buses are affordable, many students use them.', 'Vì xe buýt có giá phải chăng, nhiều sinh viên sử dụng chúng.', 'Because giới thiệu lý do.'], ['The service is slow; however, it is reliable.', 'Dịch vụ chậm; tuy nhiên, nó đáng tin cậy.', 'However nối ý tương phản.']],
        'mistake' => ['The scheme is costly, therefore it may bring long-term benefits.', 'The scheme is costly; however, it may bring long-term benefits.', 'Ý sau tương phản chứ không phải kết quả nên dùng however.'],
        'tip' => 'Trong đoạn văn, phân biệt rõ reason, result và contrast trước khi chọn linker.',
    ],
    'b2-complex-passives' => [
        'examples' => [['It is often claimed that remote work improves flexibility.', 'Người ta thường cho rằng làm việc từ xa tăng tính linh hoạt.', 'Impersonal passive cho nhận định chung.'], ['The measure is expected to reduce emissions.', 'Biện pháp được kỳ vọng sẽ giảm khí thải.', 'Passive reporting verb cô đọng lập luận.']],
        'mistake' => ['The policy is believed that it will succeed.', 'The policy is believed to succeed.', 'Khi chủ thể được đưa lên đầu câu, dùng be believed to.'],
        'tip' => 'Trong bài luận, complex passive giúp đưa nguồn nhận định ra nền và tập trung vào luận điểm.',
    ],
    'b2-third-mixed-conditionals' => [
        'examples' => [['If the council had acted sooner, it would have prevented the flood.', 'Nếu hội đồng hành động sớm hơn, họ đã ngăn được trận lụt.', 'Third conditional nhìn lại quá khứ.'], ['If I had chosen engineering, I would work in technology now.', 'Nếu tôi từng chọn ngành kỹ thuật, giờ tôi sẽ làm trong công nghệ.', 'Mixed conditional nối quá khứ với hiện tại.']],
        'mistake' => ['If the company had trained staff, productivity will be higher now.', 'If the company had trained staff, productivity would be higher now.', 'Kết quả giả định ở hiện tại cần would, không dùng will.'],
        'tip' => 'Dùng mixed conditional khi một quyết định quá khứ được liên hệ trực tiếp với hệ quả hiện tại.',
    ],
    'b2-modal-deduction' => [
        'examples' => [['The lights are on, so somebody must be inside.', 'Đèn đang sáng nên hẳn có người ở trong.', 'Must cho suy đoán chắc chắn hiện tại.'], ['They might have missed the deadline.', 'Họ có thể đã lỡ hạn nộp.', 'Might have cho khả năng trong quá khứ.']],
        'mistake' => ['She must forgot the appointment.', 'She must have forgotten the appointment.', 'Suy đoán về quá khứ cần modal + have + V3.'],
        'tip' => 'Trong Speaking, dùng might have hoặc must have để đưa suy luận có mức độ chắc chắn rõ ràng.',
    ],
    'b2-participle-clauses' => [
        'examples' => [['Faced with higher costs, families reduced spending.', 'Đối mặt với chi phí cao hơn, các gia đình giảm chi tiêu.', 'Past participle thể hiện trạng thái bị tác động.'], ['Having completed the survey, the team analysed the results.', 'Sau khi hoàn thành khảo sát, nhóm phân tích kết quả.', 'Having + V3 thể hiện hành động xảy ra trước.']],
        'mistake' => ['Having finish the report, she sent it to her manager.', 'Having finished the report, she sent it to her manager.', 'Sau having phải dùng past participle.'],
        'tip' => 'Chỉ dùng participle clause khi chủ thể ngầm của mệnh đề rút gọn trùng với chủ thể câu chính.',
    ],
    'b2-hedging' => [
        'examples' => [['It seems that public opinion is changing.', 'Có vẻ dư luận đang thay đổi.', 'Seems that làm nhận định thận trọng.'], ['This approach tends to benefit larger firms.', 'Cách tiếp cận này có xu hướng có lợi cho doanh nghiệp lớn.', 'Tends to tránh khẳng định tuyệt đối.']],
        'mistake' => ['The data suggests that the measure definitely solves the problem.', 'The data suggests that the measure may help address the problem.', 'Bằng chứng hạn chế không hỗ trợ kết luận tuyệt đối.'],
        'tip' => 'Trong Writing Task 2, hedge các kết luận khi dữ kiện chỉ cho thấy xu hướng thay vì bằng chứng tuyệt đối.',
    ],
    'b2-discourse-linking' => [
        'examples' => [['In addition, cycling reduces noise pollution.', 'Ngoài ra, đạp xe làm giảm ô nhiễm tiếng ồn.', 'Bổ sung một lợi ích.'], ['While the plan is expensive, its benefits are considerable.', 'Mặc dù kế hoạch tốn kém, lợi ích của nó đáng kể.', 'While mở ý nhượng bộ.']],
        'mistake' => ['Public transport is efficient. In addition, it requires major investment.', 'Public transport is efficient. Nevertheless, it requires major investment.', 'Ý sau là hạn chế tương phản nên dùng nevertheless.'],
        'tip' => 'Đặt discourse marker ở đầu câu mới khi chuyển chức năng lập luận để người đọc theo dõi dễ hơn.',
    ],
    'c1-inversion-emphasis' => [
        'examples' => [['Rarely do policymakers consider long-term care needs.', 'Hiếm khi các nhà hoạch định chính sách cân nhắc nhu cầu chăm sóc dài hạn.', 'Trạng từ phủ định kéo theo đảo trợ động từ.'], ['Only after the trial ended did the risks become clear.', 'Chỉ sau khi thử nghiệm kết thúc, các rủi ro mới trở nên rõ ràng.', 'Only after tạo nhấn mạnh thời điểm.']],
        'mistake' => ['Seldom governments acknowledge this trade-off.', 'Seldom do governments acknowledge this trade-off.', 'Sau seldom đầu câu cần auxiliary trước subject.'],
        'tip' => 'Dùng inversion có chọn lọc để nhấn mạnh luận điểm, không lạm dụng trong mọi câu học thuật.',
    ],
    'c1-cleft-sentences' => [
        'examples' => [['It is affordable housing that young families require most.', 'Chính nhà ở hợp túi tiền là điều các gia đình trẻ cần nhất.', 'It-cleft nhấn mạnh đối tượng.'], ['What this debate overlooks is the cost of inaction.', 'Điều cuộc tranh luận này bỏ qua là chi phí của việc không hành động.', 'What-cleft làm nổi bật luận điểm.']],
        'mistake' => ['What the policy needs are stronger enforcement.', 'What the policy needs is stronger enforcement.', 'Mệnh đề what làm chủ ngữ số ít trong cấu trúc này.'],
        'tip' => 'Cleft sentence hữu ích khi mở đoạn phản biện hoặc nhấn mạnh yếu tố quyết định.',
    ],
    'c1-nominalisation' => [
        'examples' => [['The implementation of the policy requires public support.', 'Việc thực thi chính sách cần sự ủng hộ của công chúng.', 'Danh từ hóa tạo giọng văn học thuật.'], ['Rapid urban expansion has increased demand for housing.', 'Sự mở rộng đô thị nhanh chóng đã làm tăng nhu cầu nhà ở.', 'Cụm danh từ gom thông tin hiệu quả.']],
        'mistake' => ['The reduce of emissions should be a priority.', 'The reduction of emissions should be a priority.', 'Cần dùng danh từ reduction, không dùng động từ reduce.'],
        'tip' => 'Dùng nominalisation để cô đọng ý, nhưng tránh chuỗi danh từ quá dài làm câu khó đọc.',
    ],
    'c1-reduced-clauses' => [
        'examples' => [['Students living in rural areas may face connectivity barriers.', 'Sinh viên sống ở vùng nông thôn có thể gặp rào cản kết nối.', 'V-ing rút gọn mệnh đề chủ động.'], ['Data collected over ten years reveals a steady decline.', 'Dữ liệu được thu thập trong mười năm cho thấy sự suy giảm đều.', 'V3 rút gọn mệnh đề bị động.']],
        'mistake' => ['Measures introduce last year have reduced waste.', 'Measures introduced last year have reduced waste.', 'Danh từ nhận hành động cần past participle.'],
        'tip' => 'Khi rút gọn mệnh đề, kiểm tra danh từ đang thực hiện hay nhận hành động để chọn V-ing hoặc V3.',
    ],
    'c1-nuanced-modality' => [
        'examples' => [['The reform may well improve access in remote regions.', 'Cải cách rất có thể cải thiện khả năng tiếp cận ở vùng xa.', 'May well thể hiện khả năng đáng kể.'], ['The proposal would appear to underestimate staffing costs.', 'Đề xuất dường như đánh giá thấp chi phí nhân sự.', 'Would appear to tạo đánh giá thận trọng.']],
        'mistake' => ['There is a strong case to investing in prevention.', 'There is a strong case for investing in prevention.', 'Cụm a case for theo sau bởi danh từ hoặc V-ing.'],
        'tip' => 'Nuanced modality giúp đánh giá chính sách chính xác hơn thay vì dùng các khẳng định tuyệt đối.',
    ],
    'c1-formal-cohesion' => [
        'examples' => [['Granted that the reform is expensive, it addresses a pressing need.', 'Dù thừa nhận cải cách tốn kém, nó giải quyết một nhu cầu cấp thiết.', 'Granted that mở phần nhượng bộ trang trọng.'], ['Notwithstanding public opposition, the measure was implemented.', 'Bất chấp sự phản đối của công chúng, biện pháp đã được thực hiện.', 'Notwithstanding theo sau bởi noun phrase.']],
        'mistake' => ['Notwithstanding that costs are high, prevention is worthwhile.', 'Notwithstanding the high costs, prevention is worthwhile.', 'Notwithstanding trực tiếp kết hợp với noun phrase trong cấu trúc mục tiêu.'],
        'tip' => 'Dùng cohesion trang trọng khi cần thừa nhận phản biện trước khi bảo vệ lập luận chính.',
    ],
];
