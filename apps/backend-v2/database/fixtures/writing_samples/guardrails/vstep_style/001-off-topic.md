---
label: "Guardrail 01: Lạc đề"
sample_type: "guardrail"
sample_id: "guardrail-writing-off-topic-001"
reference_id: "vstep_writing"
risk_type: "off_topic"
task_type: "writing_task_2_essay"
expected_behavior:
  max_level: "Không đạt"
  max_band: 3.5
  required_caps:
    - "content_cap"
reason: "Bài viết dùng tiếng Anh tương đối ổn nhưng không trả lời đúng đề, nên không được chấm cao."
criterion_scores:
  task_fulfillment: 2.0
  organization: 4.0
  grammar: 6.0
  vocabulary: 5.0
scoring_policy:
  content_caps:
    - when_content_below: 3.0
      max_overall: 3.5
---

Topic: Do you think students should wear uniforms at school?

Answer: Online learning is becoming popular because students can study at home. It saves travelling time and allows people to watch recorded lessons many times. In my opinion, technology will continue to change education in the future.
