# 02. Scoring Q&A

File này dùng khi hội đồng hỏi sâu. Trên main deck chỉ nên đưa bảng chỉ số/công thức ngắn để chứng minh backend tính điểm bằng công thức định lượng, không đưa toàn bộ công thức dài.

## Cách trình bày trên slide chính

```text
Input metric           Extracted by          Used for
Word count             Text analyzer         Length cap
Spelling errors        Text analyzer         Spelling penalty
Topic relevance        AI-assisted analysis  Relevance score / off-topic penalty
Pause count            Speech analyzer       Fluency penalty
Pronunciation signals  Speech service        Pronunciation score

Writing/Speaking score = fixed formula(input metrics) + caps / penalties
```

AI/công cụ ngoài chỉ lấy chỉ số đầu vào và hỗ trợ feedback. Điểm Writing/Speaking trong practice/mock test do backend tính bằng công thức cố định.

## Công thức tổng

```text
Listening/Reading = round(correct_answers / total_questions * 10, 0.1)

WritingTask  = round_to_0.5((TaskFulfillmentScore + OrganizationScore + GrammarScore + VocabularyScore) / 4)
WritingSkill = round_to_0.5((Task1Score + 2 × Task2Score) / 3)

SpeakingPart  = round_to_0.5((GrammarScore + VocabularyScore + FluencyScore + DiscourseScore + PronunciationScore) / 5)
SpeakingSkill = round(average(PartBands), 0.1)

OverallMockExam = round_to_0.5((ListeningScore + ReadingScore + WritingSkill + SpeakingSkill) / 4)
```

## Writing — công thức từng tiêu chí

```text
TaskFulfillmentRaw = (CoveredPoints / RequiredPoints) × 7
                   + DevelopmentDepth × 3
                   + ExampleBonus
                   + PositionBonus
                   - OffTopicPenalty

TaskFulfillmentScore = min(round_to_0.5(TaskFulfillmentRaw), WordCountCap)
TaskFulfillmentScore <= average(GrammarScore, VocabularyScore, OrganizationScore) × 1.3

OrganizationScore = 1 + ParagraphBonus + LinkingScore + SentenceVarietyBonus - CompactPenalty

GrammarScore = round_to_0.5((StructureRange + GrammarAccuracy) / 2 - PunctuationPenalty)

VocabularyRaw = 0.45×LexicalRange + 0.25×Sophistication + 0.20×Diversity + 0.10×Readability
VocabularyScore = min(10, round_to_0.5(VocabularyRaw - SpellingPenalty))
```

Chú thích:

- `CoveredPoints / RequiredPoints`: số ý chính đã đáp ứng trên tổng số ý đề yêu cầu.
- `DevelopmentDepth`: mức độ phát triển/lý giải ý.
- `PositionBonus`: điểm cộng khi bài có mục đích/quan điểm rõ.
- `OffTopicPenalty`: điểm trừ khi lạc đề hoặc có nội dung không liên quan.
- `StructureRange`: độ đa dạng cấu trúc câu.
- `GrammarAccuracy`: độ chính xác ngữ pháp sau khi xét lỗi.
- `LexicalRange`, `Sophistication`, `Diversity`, `Readability`: chất lượng từ vựng, độ nâng cao, độ đa dạng và độ dễ đọc.

## Speaking — công thức từng tiêu chí

```text
GrammarScore = round_to_0.5((StructureRange + GrammarAccuracy) / 2)

VocabularyScore = min(10, round_to_0.5(
    3 + DiversityBonus + AverageWordLengthBonus + ReadabilityBonus + VocabularyDepthBonus
))

PausesPer100Words = PauseCount / WordCount × 100
PausePenalty = 2 if PausesPer100Words > 15
             = 1 if PausesPer100Words > 8
             = 0 otherwise
FluencyScore = round_to_0.5(3 + SpeakingRateBonus - PausePenalty)

DiscourseScore = round_to_0.5(IdeaDevelopment × ContentRelevance)

PronunciationRaw = 0.45×Accuracy + 0.20×Fluency + 0.20×Prosody + 0.15×Completeness
Penalty = MispronunciationPenalty + BreakPenalty + MonotonePenalty
PronunciationScore = round_to_0.5(PronunciationRaw - Penalty)
```

Chú thích:

- `StructureRange`: độ đa dạng cấu trúc trong transcript.
- `GrammarAccuracy`: độ chính xác ngữ pháp trong transcript.
- `DiversityBonus`: điểm cộng cho độ đa dạng từ.
- `SpeakingRateBonus`: điểm cộng theo tốc độ nói.
- `PausePenalty`: điểm trừ theo số lần ngập ngừng.
- `IdeaDevelopment`: mức phát triển ý trong câu trả lời.
- `ContentRelevance`: mức độ bám đề.
- `Accuracy`, `Fluency`, `Prosody`, `Completeness`: tín hiệu phát âm từ speech service.
- `Penalty`: điểm trừ cho lỗi phát âm, ngắt nghỉ sai hoặc giọng đều.

## Guardrails

```text
Writing: quá ngắn / lạc đề / copy / spam -> cap điểm
Speaking: wordCount < 20 -> 1.0
Speaking: wordCount < 40 -> cap 4.0
Speaking: ASR confidence < 0.65 -> cap 4.0
Speaking: ContentRelevance < 0.40 -> cap 4.0
```

## Probe takeaway

Command đã chạy:

```text
php artisan linguistics:probe --domain=all
Result: Linguistic probe passed.
```

### Grammar/Vocabulary đã ổn chưa?

- Đủ ổn cho **điểm tham khảo trong luyện tập/thi thử** vì writing/speaking probes đều pass trong ngưỡng kiểm tra.
- Chưa khẳng định độ chính xác tương đương chấm chính thức vì chưa có bộ dữ liệu lớn do giám khảo VSTEP chấm.
- Grammar đang hơi conservative: writing probe thường cho GrammarScore khoảng 6.0 khi grammar-types chỉ 2–3.
- Vocabulary nhạy với evidence: writing vocab dao động 4.5–7.5; speaking có case VocabularyScore lên 10.0 nên có thể kéo điểm lên.

### Vì sao điểm lệch?

- Writing lệch chủ yếu do Grammar/Vocabulary/Organization evidence kéo lên/xuống, không phải do AI tự chọn điểm.
- Speaking lệch khi thiếu audio metrics: transcript-only sample không có Fluency/Pronunciation nên điểm dựa trên các tiêu chí còn lại.
- Speaking có audio vẫn phụ thuộc tốc độ nói, số lần ngập ngừng, tín hiệu phát âm và mức độ bám đề.

### Probe thấy gì?

```text
Writing: 9/9 probes passed, actual band lệch trong khoảng ±0.5 so với expected.
Speaking: 3/3 probes passed.
- Part 1 transcript-only: expected 6.0 -> actual 7.0 vì thiếu tín hiệu độ trôi chảy/phát âm.
- Part 2 audio metrics: expected 7.0 -> actual 7.0.
- Part 3 audio metrics: expected 7.0 -> actual 7.5 do VocabularyScore cao.
```

Cách nói ngắn:

```text
Probe cho thấy tín hiệu ngữ pháp/từ vựng hoạt động đủ ổn cho luyện tập, nhưng có lệch do cách trích xuất bằng chứng: grammar hơi bảo thủ, vocabulary nhạy với bằng chứng từ vựng, speaking phụ thuộc audio/transcript. Vì vậy điểm dùng để feedback và định hướng học, không thay thế giám khảo chính thức.
```

## Q&A trọng yếu

### Q1. AI có chấm điểm cuối không?

Không. AI/công cụ ngoài chỉ lấy tín hiệu hoặc tạo feedback. Điểm Writing/Speaking trong practice/mock test do backend tính từ chỉ số đầu vào và công thức trong hệ thống.

### Q2. 20%/25% có phải thuật toán không?

Không. Đó là trọng số tổng hợp cuối. Bên trong mỗi tiêu chí có công thức riêng như Grammar, Fluency, Pronunciation.

### Q2b. Grammar/Vocabulary đã ổn chưa?

Đủ ổn cho luyện tập: probe pass. Nhưng chưa phải điểm chính thức vì grammar/vocab vẫn phụ thuộc tín hiệu trích xuất và cần dữ liệu giám khảo chính thức để calibrate lớn hơn.

### Q2c. Vì sao điểm có thể lệch?

Vì điểm được kéo bởi evidence: grammar-types, lexical evidence, organization, audio quality, transcript, fluency/pronunciation. Probe dùng để nhìn chính xác tiêu chí nào đang kéo điểm lên/xuống.

### Q3. Dịch vụ phát âm có quyết định Speaking score không?

Không. Dịch vụ phát âm chỉ trả các tín hiệu con như độ chính xác, độ trôi chảy, ngữ điệu và mức độ đầy đủ. Backend kết hợp các tín hiệu này bằng công thức Pronunciation rồi mới đưa vào Speaking score.

### Q4. Công thức có tùy tiện không?

Công thức và ngưỡng điểm nằm trong bộ tiêu chí có version. Admin có thể tạo draft, simulate và activate. Nhóm không claim đây là điểm chính thức VSTEP.

### Q5. Bài lạc đề nhưng tiếng Anh tốt thì sao?

Writing có OffTopicPenalty, WordCountCap và TaskFulfillmentCap. Speaking có ContentRelevance cap. Vì vậy bài lạc đề không thể chỉ nhờ tiếng Anh tốt mà lên điểm cao.

### Q6. Điểm này có thay giám khảo không?

Không. Điểm Writing/Speaking là điểm tham khảo cho luyện tập/thi thử, không phải điểm chính thức.

## Code evidence nếu bị hỏi

- `WritingScoringFormula.php` — định nghĩa công thức tính điểm Writing từ các chỉ số đầu vào.
- `SpeakingScoringFormula.php` — định nghĩa công thức tính điểm Speaking từ transcript và audio metrics.
- `WritingAssessmentStrategy.php` — quy trình đánh giá Writing: lấy evidence → scoring → feedback.
- `SpeakingAssessmentStrategy.php` — quy trình đánh giá Speaking: transcript + audio → scoring → feedback.
- `ExamScoringService.php` — tổng hợp điểm 4 kỹ năng (Listening, Reading, Writing, Speaking) cho mock test.
