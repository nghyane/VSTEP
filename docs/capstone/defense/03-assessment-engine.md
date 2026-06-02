# 03. Assessment Engine

## Key message

> External services chỉ cung cấp tín hiệu. Backend mới là nơi tính điểm cuối theo rubric/formula minh bạch.

## Flow chung

```text
Input bài làm
→ Trích xuất tín hiệu
→ Ánh xạ rubric/descriptor
→ Tính điểm
→ Trả feedback/evidence
```

## Writing

Tiêu chí chính: Task Fulfillment, Organization, Grammar, Vocabulary.

Tín hiệu dùng:

- LanguageTool: grammar/spelling/punctuation errors.
- CEFR-J/Open Language Profiles: vocabulary level.
- SyntaxAnalyzer: grammar structures.
- Linguistic Reference DB: linking phrases, collocations.
- Prompt/requirements: task relevance.
- Format checks: Task 1 salutation, closing, tone.

Guardrails: lạc đề, quá ngắn, copy đề, lặp/spam, không phải tiếng Anh.

## Speaking

Tiêu chí chính: Grammar, Vocabulary, Fluency, Discourse Management, Pronunciation.

Tín hiệu dùng:

- Azure Speech: transcript, speaking rate, pauses, ASR confidence.
- Azure pronunciation: độ chính xác phát âm, độ trôi chảy, ngữ điệu và mức độ hoàn thành bài nói.
- LanguageTool filtered errors.
- CEFR vocabulary và syntax structures.
- Descriptor checklist theo từng speaking part.

Pronunciation formula:

```text
45% độ chính xác phát âm + 20% độ trôi chảy + 20% ngữ điệu + 15% mức độ hoàn thành - lỗi phát âm theo từng từ
```

Các trường hợp Speaking bị giới hạn điểm: transcript quá ngắn, câu trả lời quá ngắn, độ tin cậy nhận dạng giọng nói thấp, hoặc lạc đề khi có đề bài/yêu cầu.

## Câu cần nói

> AI không tự quyết định điểm. AI/external services chỉ hỗ trợ lấy tín hiệu; điểm cuối do backend tính theo rubric và công thức minh bạch.

## Tránh nói

- “AI chấm thay giám khảo.”
- “Azure quyết định điểm phát âm.”
- “LanguageTool quyết định điểm grammar.”
