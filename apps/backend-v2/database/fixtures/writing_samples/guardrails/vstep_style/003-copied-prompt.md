---
label: "Guardrail 03: Copy đề"
sample_type: "guardrail"
sample_id: "guardrail-writing-copied-prompt-003"
reference_id: "vstep_writing"
risk_type: "copied_prompt"
task_type: "writing_task_2_essay"
expected_behavior:
  max_level: "Không đạt"
  max_band: 3.5
reason: "Bài chủ yếu lặp lại đề, không có câu trả lời thật hoặc lập luận riêng."
criterion_scores:
  task_fulfillment: 1.5
  organization: 2.0
  grammar: 4.0
  vocabulary: 4.0
scoring_policy:
  content_caps:
    - when_content_below: 2.0
      max_overall: 3.5
---

Some people believe that a university degree is essential for getting a good job, while others think that experience and skills are more important. Discuss both views and give your opinion. A university degree is essential for getting a good job, while experience and skills are more important.
