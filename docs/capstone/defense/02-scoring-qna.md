# 02. Scoring Q&A

File này chỉ dùng khi hội đồng hỏi sâu. Không đưa hết vào main deck.

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

## Guardrails

```text
Writing: quá ngắn / lạc đề / copy / spam -> cap điểm
Speaking: wordCount < 20 -> 1.0
Speaking: wordCount < 40 -> cap 4.0
Speaking: ASR confidence < 0.65 -> cap 4.0
Speaking: ContentRelevance < 0.40 -> cap 4.0
```

## Q&A trọng yếu

### Q1. AI có chấm điểm cuối không?

Không. AI/công cụ ngoài chỉ lấy tín hiệu hoặc tạo feedback. Điểm cuối do backend tính từ rubric, signals và formula.

### Q2. 20%/25% có phải thuật toán không?

Không. Đó là trọng số tổng hợp cuối. Bên trong mỗi tiêu chí có công thức riêng như Grammar, Fluency, Pronunciation.

### Q3. Dịch vụ phát âm có quyết định Speaking score không?

Không. Dịch vụ phát âm chỉ trả sub-signals như accuracy, fluency, prosody, completeness. Backend kết hợp các sub-signals bằng công thức Pronunciation rồi mới đưa vào Speaking score.

### Q4. Công thức có tùy tiện không?

Công thức/threshold nằm trong rubric parameters và có version. Admin có thể tạo draft, simulate, activate. Nhóm không claim đây là điểm chính thức VSTEP.

### Q5. Bài lạc đề nhưng tiếng Anh tốt thì sao?

Writing có OffTopicPenalty, WordCountCap và TaskFulfillmentCap. Speaking có ContentRelevance cap. Vì vậy bài lạc đề không thể chỉ nhờ tiếng Anh tốt mà lên điểm cao.

### Q6. Điểm này có thay giám khảo không?

Không. Writing/Speaking score là điểm luyện tập/thi thử tham khảo, không phải điểm chính thức.

## Code evidence nếu bị hỏi

- `WritingScoringFormula.php`
- `SpeakingScoringFormula.php`
- `WritingAssessmentStrategy.php`
- `SpeakingAssessmentStrategy.php`
- `ExamScoringService.php`
