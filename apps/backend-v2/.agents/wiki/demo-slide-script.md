# Slide Demo Script

Kịch bản thuyết trình VSTEP — focus scoring mechanism.

## SLIDE 1 — Context

- VSTEP: chứng chỉ ngoại ngữ nội địa Việt Nam (Thông tư 23/2017)
- 200+ trường ĐH áp dụng, nhu cầu luyện tập lớn
- Công cụ hiện tại: file PDF/Word rải rác, không chấm Writing/Speaking tự động

## SLIDE 2 — Cấu trúc đề

| Skill | Số phần | Format | Thời gian |
|-------|---------|--------|-----------|
| Listening | 3 phần (35 câu) | MCQ | ~40 phút |
| Reading | 4 passages (40 câu) | MCQ | 60 phút |
| Writing | 2 tasks | ≥120 + ≥250 từ | 60 phút |
| Speaking | 3 phần | Phỏng vấn/Thảo luận | 12 phút |

Thang 0-10/skill. CEFR: B1 ≥ 4.0, B2 ≥ 6.0, C1 ≥ 8.5.

## SLIDE 3 — Kiến trúc chấm điểm

```
Pipeline 5-layer:
  Layer 1: LanguageTool — grammar errors
  Layer 2: Metrics + SyntaxAnalyzer — 10 structure types
  Layer 3: LLM Evidence — requirements check (temp=0)
  Layer 4: Formula — reads rubric params from DB
  Layer 5: Sanity penalty — W × min(1, w/120)
```

**LLM không chấm điểm** — chỉ extract evidence: "đáp ứng 3/4 yêu cầu".
**Formula tính điểm**: `(3/4)×7 + 1 = 6.5`.
**Rubric-driven**: params trong DB, đổi không cần code.

## SLIDE 4 — Công thức (4 criteria)

| Criterion | Input | Formula |
|-----------|-------|---------|
| Grammar | SyntaxAnalyzer (10 types) + errors | `(structureBand + accuracy) / 2` |
| Vocabulary | unique_ratio + avg_word_length | `base + uniqueBonus + lengthBonus` |
| Task | LLM: requirements met/total | `(met/total)×M + position - irrelevant` |
| Organization | paragraphs + linking + variety | `base + paraBonus + linkingBonus + varietyBonus` |

Deterministic: 3/4 pure math, 1/4 LLM-assisted (temp=0, reproducible).

## SLIDE 5 — Rubric configurable

```
grading_rubrics (DB, v4):
  criteria[grammar].params = {
    band_thresholds: [0→5, 1→6, 3→7, 5→8, 6→9, 7→10],
    accuracy_factor: 5,
    max_accuracy: ['0-2'→7, '3-4'→9, '5+'→10]
  }
```

Đổi `[3→7]` thành `[2→7]` → re-seed → grammar score thay đổi. **Không code.**

Mỗi param có `_sources` documentation — truy vết được nguồn gốc.

## SLIDE 6 — LLM role: Evidence extraction

```
Các hệ thống khác: Text → LLM → "7.5 điểm"         ← black box
Hệ thống này:      Text → LLM → "met=3, total=4"  → Formula → 6.5  ← traceable
```

LLM output: 4 số (requirements_met, requirements_total, has_position, has_irrelevant).

Admin config requirements: `["State opinion", "Give 2 reasons", "Include example"]`
LLM checks mỗi requirement → đếm.

Feedback: strengths, improvements, rewrites (tiếng Việt).

## SLIDE 7 — Overall formula

```
L = round(C_L/35 × 10, 1)          MCQ Listening
R = round(C_R/40 × 10, 1)          MCQ Reading
W = round((W₁ + 2W₂)/3, 0.5)      Writing composite (ULIS-VNU paper)
S = round(mean(5 criteria), 0.5)    Speaking formula (4/5 deterministic, 1/5 LLM factor)

O = round((L + R + W + S) / 4, 0.5)
Level = O ≥ 8.5 ? C1 : O ≥ 6.0 ? B2 : O ≥ 4.0 ? B1 : Không đạt
```

W₁, W₂: per-task = `round(mean(G,V,T,O), 0.5) × min(1, words/120)`.

## SLIDE 8 — Kết quả validation

| Essay | Level | Score |
|-------|-------|-------|
| Bài 6 (50 từ, lỗi) | Không đạt | 3.0 |
| Bài 7 (B1 basic) | B1 | 4.5 |
| Bài 8 (B1 decent) | B1 | 5.5 |
| Bài 9 (B2 quality) | B2 | 7.0 |
| Bài 10 (B2 solid) | B2 | 8.0 |

10/10 CEFR match. System discriminates: 3.0 → 4.5 → 5.5 → 7.0 → 8.0.

## SLIDE 9 — Deterministic

| Criterion | Deterministic |
|-----------|:--:|
| Grammar | ✅ Pure math |
| Vocabulary | ✅ Pure math |
| Organization | ✅ Pure math |
| Task Fulfillment | ✅ LLM temp=0 |
| MCQ | ✅ Pure math |

3/3 identical runs. Cùng input → cùng output. **Debug được từng bước.**

## SLIDE 10 — Stack & Tests

- Laravel 13, PHP 8.4, PostgreSQL, Docker
- deepseek-v4-flash (LLM), LanguageTool (Docker)
- **293 tests**, 0 failures
- Formula unit tests (13), pipeline integration, validation (10 essays)
- `php artisan validate:scoring` — chạy validation với LLM thật

## SLIDE 11 — Điểm mạnh

| Tiêu chí | |
|---|---|
| Kiến trúc | 6 services, DI, phân tầng 5-layer |
| Configurable | Rubric params DB, admin requirements |
| Deterministic | Debug được, reproduce được |
| LLM role rõ | Evidence extraction, không scoring |
| Real integration | Docker, API, DB, regex |
