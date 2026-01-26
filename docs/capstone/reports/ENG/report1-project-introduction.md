# I. Definitions and Acronyms

| Acronym | Definition |
|---------|------------|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| ASEAN | Association of Southeast Asian Nations |
| CAGR | Compound Annual Growth Rate |
| CEFR | Common European Framework of Reference for Languages |
| CNTT | Information Technology |
| EdTech | Educational Technology |
| EFL | English as a Foreign Language |
| GDP | Gross Domestic Product |
| GD&ĐT | Education and Training |
| GPT | Generative Pre-trained Transformer |
| IELTS | International English Language Testing System |
| ISSM | Information Systems Success Model |
| JSON | JavaScript Object Notation |
| LLM | Large Language Model |
| MCQ | Multiple Choice Question |
| ML | Machine Learning |
| MVP | Minimum Viable Product |
| NPS | Net Promoter Score |
| OAuth | Open Authorization |
| PWA | Progressive Web App |
| S-O-R | Stimulus-Organism-Response Model |
| SRS | Software Requirements Specification |
| TOEFL | Test of English as a Foreign Language |
| TOEIC | Test of English for International Communication |
| UVP | Unique Value Proposition |
| UX | User Experience |
| VSTEP | Vietnamese Standardized Test of English Proficiency |

| Term | Definition |
|------|------------|
| Adaptive Learning | A learning approach that adjusts content according to the learner's proficiency level |
| Adaptive Scaffolding | Flexible support that adjusts the level of assistance based on learner competency |
| A/B Testing | A comparative method of evaluating two versions to determine effectiveness |
| Anthropomorphism | Human-like characteristics in chatbots/AI systems |
| Collaborative Filtering | A recommendation technique based on similar user behavior patterns |
| Freemium | A business model offering basic features free of charge with premium features available for payment |
| Gamification | Application of game elements to learning to enhance motivation |
| Hybrid Grading | Combined AI and human evaluator scoring system |
| Pilot Phase | Testing phase with real user groups |
| Productive Skills | Active skills (Speaking, Writing) that involve language production |
| Receptive Skills | Passive skills (Listening, Reading) that involve language comprehension |
| Rule-based | System operating according to predefined rules |
| Skill Gap | Proficiency discrepancy between different skills |
| Sliding Window | Method of calculating averages from recent exercises |
| Spider Chart | Multi-dimensional competency visualization tool |
| Speech-to-Text | Voice-to-text conversion technology |

# II. Project Introduction

## 1. Overview

### 1.1 Project Information

- Project name (EN): An Adaptive VSTEP Preparation System with Comprehensive Skill Assessment and Personalized Learning Support
- Project name (VN): Hệ Thống Luyện Thi VSTEP Thích Ứng Với Đánh Giá Toàn Diện Kỹ Năng Và Hỗ Trợ Học Tập Cá Nhân Hóa
- Project code: SP26SE145
- Group name: GSP26SE63
- Software type: Web Application & Mobile Application
- Duration: 01/01/2026 – 30/04/2026

### 1.2 Project Team

| Full Name | Role | Email | Mobile |
|-----------|------|-------|--------|
| Lâm Hữu Khánh Phương | Academic Supervisor | phuonglhk@fe.edu.vn | N/A |
| Trần Trọng Huỳnh | Industry Supervisor | huynhtt4@fe.edu.vn | 0988258758 |
| Hoàng Văn Anh Nghĩa | Team Leader | nghiahvase172605@fpt.edu.vn | N/A |
| Nguyễn Minh Khôi | Developer | khoinmse172625@fpt.edu.vn | 0944207257 |
| Nguyễn Nhật Phát | Developer | phatnnse172607@fpt.edu.vn | 0981567488 |
| Nguyễn Trần Tấn Phát | Developer | phatnttse173198@fpt.edu.vn | 0343062376 |

## 2. Product Background

In the era of global integration, foreign language proficiency plays a crucial role in academic success and career advancement. The VSTEP (Vietnamese Standardized Test of English Proficiency), recognized by the Ministry of Education and Training under Decision No. 729/QĐ-BGDĐT dated March 11, 2015, serves as an instrument for assessing foreign language competency according to the 6-level Vietnamese Language Proficiency Framework (aligned with CEFR), with proficiency levels ranging from A1 to C1.

**Scale and Significance:**

- According to Circular 01/2014/TT-BGDĐT, foreign language certificates (including VSTEP) are mandatory graduation requirements for university students.
- Currently, 38 authorized testing centers are licensed by the Ministry of Education and Training to administer VSTEP examinations nationwide (data updated March 2025 from the Quality Management Department)[^5].
- VSTEP is widely used for:
  - University/college graduation eligibility assessment (common requirement: B1-B2)
  - Certification for English language teachers (requirement: B2-C1)
  - Public sector recruitment and career advancement

**Current Challenges:**

Based on analysis of foreign language learning research and VSTEP preparation market characteristics, the team has identified the following key challenges:

| Challenge | Description |
|------------|-------|
| Skill Gap | Uneven proficiency across the four skills. Learners may achieve B2 in Reading but only A2 in Speaking - a common phenomenon in foreign language learning (receptive vs. productive skills) |
| Static Materials | Traditional methods relying on fixed content that does not adapt to actual proficiency levels |
| Lack of Personalization | Uniform classroom approaches that cannot accommodate individual needs |
| Lack of Immediate Feedback | Writing and Speaking skills are not evaluated promptly, leading to repeated mistakes |

*Note: The challenges identified above will be validated during the Requirements Elicitation phase.*

**Proposed Solution:**

The "Adaptive VSTEP Preparation System" project has been developed with the following objectives:

- Transitioning from "fixed-level" to "level-oriented" learning models
- Integrating a dual-module architecture: Intensive Practice and Mock Testing
- Implementing Adaptive Scaffolding to personalize learning pathways

## 3. Existing Systems

The team analyzed existing solutions according to five evaluation criteria:

1. **Personalization:** Ability to adjust content according to learner proficiency
2. **Four-Skill Assessment:** Comprehensive support for Listening, Speaking, Reading, and Writing
3. **Immediate Feedback:** Waiting time for assessment results
4. **Progress Tracking:** Visualization and analytics tools
5. **VSTEP Alignment:** Adherence to official format and rubric

### 3.1 Traditional VSTEP Preparation Methods

Traditional offline preparation centers and textbooks with "one-size-fits-all" programs.

| Advantages | Disadvantages |
|---------|------------|
| High reliability - content aligned with official test structure | Lack of personalization - does not account for proficiency discrepancies |
| Direct interaction - immediate query resolution | Difficulty tracking development of specific skills |
| | Inflexible time schedules - barrier for working professionals |

### 3.2 General English Learning Applications

Examples: Duolingo (duolingo.com), ELSA Speak (elsaspeak.com)

| Advantages | Disadvantages |
|---------|------------|
| High interactivity with gamification | Generic content - not designed for VSTEP |
| Accessible - fully mobile-based, low cost | Skill imbalance (ELSA: Speaking only, Duolingo: lacks Writing/Academic Reading B2-C1) |

### 3.3 VSTEP Mock Test Platforms

Examples: luyenthivstep.vn, vstepmaster.edu.vn, tienganh123.com

| Advantages | Disadvantages |
|---------|------------|
| Exam familiarization - computer-based testing interface | Weak productive skill assessment - lack of AI for Writing/Speaking |
| Immediate results for Listening/Reading | No adaptive learning pathway |
| Large repository of past examinations | Static data analysis - scores only, lacking visualization |

### 3.4 AI Writing & Speaking Platforms

Examples: Grammarly (grammarly.com), Write & Improve by Cambridge (writeandimprove.com), SpeechAce (speechace.com)

| Advantages | Disadvantages |
|---------|------------|
| AI immediate feedback for grammar, pronunciation | Not aligned with VSTEP rubric (different scoring criteria) |
| Advanced technology, good UX | Focuses on only 1-2 skills, not comprehensive |
| | No mock tests following VSTEP format |

### 3.5 IELTS/TOEFL Preparation Platforms

Examples: Magoosh (magoosh.com), British Council - Road to IELTS (takeielts.britishcouncil.org)

| Advantages | Disadvantages |
|---------|------------|
| Adaptive learning model already proven | Format and rubric completely different from VSTEP |
| Complete ecosystem | High cost ($100-200/year) |
| | Does not serve Vietnamese certification objectives |

### 3.6 Comparative Analysis Summary

| Criteria | Traditional | Duolingo/ELSA | Online Mock Test | AI Tools | IELTS Prep | Proposed System |
|----------|--------------|---------------|------------------|----------|------------|------------------|
| Personalization | No | Partial | No | Partial | Yes | Adaptive Scaffolding |
| 4-Skill Assessment | Yes | No | 2/4 | No | Yes | Hybrid Grading |
| Immediate Feedback | No | Yes | MCQ only | Yes | Partial | AI + Human |
| Progress Tracking | No | Basic | No | No | Partial | Spider Chart + Sliding Window |
| VSTEP Alignment | Yes | No | Yes | No | No | Yes |
| Cost | High | Low/Free | Low | Medium | High | Medium |

**Analysis Conclusion:** No existing solution combines all three factors: (1) VSTEP alignment, (2) Adaptive personalization, and (3) Comprehensive four-skill assessment with immediate feedback.

## 4. Business Opportunity

**Market Size:**

According to market research reports (IMARC Group, Ken Research, 2025-2026):

| Segment | 2025 Size | 2033-2034 Forecast | CAGR |
|---------|-------------|------------------|------|
| Vietnam EdTech (Total) | USD 1.1B | USD 3.2B (2034) | 12.31% |
| Vietnam Digital English Learning | USD 43M | USD 120.6M (2033) | 12.11% |
| Vietnam Higher Education EdTech | USD 503.79M | USD 1.376B (2033) | 15.43% |

*Source: IMARC Group Vietnam EdTech Market Report 2034; Ken Research Vietnam Adaptive Learning Market 2030*[^6][^7][^11]

**Key Growth Drivers:**

| Factor | Details |
|--------|----------|
| High Education Expenditure | Vietnamese households allocate 20-24% of total expenditure to education (ASEAN: 6-15%) |
| Technology Infrastructure | Internet users reach 79.1%, smartphone usage ranks 2nd in ASEAN[^13] |
| National 2030 Goals | Digital economy contributing 30-35% GDP; 90% of universities utilizing digital learning technology |
| EdTech Investment | EdTech receives over $400 million from 70 investors (2023)[^14] |

The VSTEP preparation market in Vietnam reveals significant gaps:

| Issue | Details |
|--------|----------|
| Skill Proficiency Gap | Learners have uneven proficiency across four skills. "One-size-fits-all" approaches waste time |
| Lack of Immediate Feedback | Writing and Speaking are productive skills (most difficult) but lack prompt assessment |
| Time Pressure | Most users are busy (final-year students, working professionals) requiring optimized learning pathways |

**Competitive Landscape Analysis:**

| Competitor | Limitation |
|---------|---------|
| Traditional Classes & Books | Static materials, fixed-level tests, lack of flexible feedback |
| VSTEP Mock Test Websites | Question bank repositories, lack of deep AI analysis, neglect Writing/Speaking assessment |
| International Applications | Not aligned with VSTEP structure, not serving Vietnamese certification objectives |

**Unique Value Proposition (UVP):**

The system creates differentiation with four core advantages and measurable indicators:

| # | Advantage | Description | Target Indicator (hypothesis) |
|---|-----------|-------|------------------------------|
| 1 | Adaptive Scaffolding | Adjusting support level based on proficiency: Writing (Template - Keywords - Free), Listening (Full text - Highlight - Pure audio) | Skill gap reduction >=30% after 4 weeks |
| 2 | Hybrid Grading | AI rapid scoring (grammar, spelling, pronunciation) + Human review for productive skills | Feedback latency: <5 minutes (AI), <24 hours (Human) |
| 3 | Advanced Visualization | Spider Chart (skill deviation) + Sliding Window (average of 10 recent exercises) | User engagement improvement vs. static charts |
| 4 | Multi-Goal Profiles | Flexible goals: B1 in 1 month - B2 in 3 months | Support >=3 concurrent learning goals |

*Note: Target indicators are hypotheses to be measured and validated during the pilot phase.*

**Accepted Trade-offs:**

- Hybrid Grading increases operational costs (requires rater team) but ensures accuracy for productive skills
- Adaptive complexity increases development effort but creates clear differentiation

**Strategic Fit:**

The project aligns with trends and policies:

| Aspect | Alignment |
|-----------|---------|
| Digital Education Transformation | Decision 131/QĐ-TTg on "Strengthening IT Application in Teaching and Learning" |
| Personalized Learning | Global trend - EdTech market projected to reach $404B by 2025 |
| Domestic Demand | VSTEP is a Vietnamese certificate, reducing dependence on IELTS/TOEFL (50-70% lower cost) |

**Hypotheses to Validate:**

- Hypothesis: Adaptive learning can reduce preparation time by 30-50% compared to traditional methods
- Validation method: A/B testing during pilot phase with two learner groups

**Scientific Foundation for Adaptive Learning:**

Recent experimental research (2023-2025), including studies conducted in Vietnam, demonstrates the effectiveness of AI and adaptive learning in language education:

| Research | Method | Result | Metric |
|------------|-------------|---------|--------|
| Wei (2023) | Mixed-methods, 60 EFL students | AI group outperformed traditional group | η² = 0.81 (L2 Achievement) |
| Liu & Zu (2024) | Adaptive English Learning System | Proficiency score increased 58.4 → 72.1 | t(98) = 9.36, p < 0.001 |
| Nguyen et al. (2025) | S-O-R model, 462 Vietnamese students | AI personalization positively impacts Learning Performance | Self-efficacy as moderating variable |
| Prep.vn (2025) | Virtual Speaking Room with AI | AI scoring accuracy vs. human raters | 90% accuracy |

*Source: Frontiers in Psychology; Informing Science Institute; Prep.vn Virtual Speaking Room*[^8][^9][^10][^12]

**Key Findings from Research in Vietnam (2025):**

Quantitative research on 462 Vietnamese university students (Nguyen et al., 2025) using the S-O-R model combined with ISSM reveals:

- **Intelligence + Personalization:** "Intelligence" and "Personalization" factors of AI platforms have significant positive impacts on Perceived Value and Perceived Trust
- **Self-efficacy:** Self-efficacy plays a moderating role - the more confident students are, the more they benefit from AI
- **Anthropomorphism:** Human-like features (emotional chatbots) increase perceived value but **do not directly influence trust** - in educational contexts, accuracy is prioritized over "friendliness"

*Note: The ">=30% skill gap reduction" indicator in UVP is a hypothesis based on the above research, to be validated during the pilot phase.*

## 5. Software Product Vision

**Vision Statement:**

For university students requiring graduation standards, working professionals needing certifications for career advancement, and language centers in Vietnam facing challenges with non-personalized VSTEP preparation methods and slow feedback, the Adaptive VSTEP Preparation Platform is a digital learning platform combining Web and Mobile that provides personalized learning pathways, four-skill assessment with immediate feedback, and progress visualization. Unlike static mock test websites (containing only questions and answers) or general English applications (not aligned with VSTEP), our product combines Adaptive Scaffolding + Hybrid Grading + Analytics to effectively narrow skill gaps.

**Measurable Vision Targets (hypothesis - to validate in pilot):**

| Indicator | Target | Timeline | Basis |
|-----------|----------|----------|-------|
| Skill gap reduction | >=30% | After 4 weeks of usage | Based on research (Wei 2023, Liu & Zu 2024) |
| Writing feedback latency | <5 minutes (AI) | MVP launch | Technical feasibility |
| User satisfaction (NPS) | >=40 | End of pilot | Industry benchmark |
| Active users retention | >=60% (monthly) | 3 months post-launch | Industry benchmark |

**Dual-Module Architecture:**

The system is designed with two main modules:

1. **PRACTICE MODE:** Adaptive exercises, Scaffolded support, Instant feedback, Skill-focused. Incorporating Adaptive Scaffolding: Writing (Template → Keywords → Free writing), Listening (Full text → Highlights → Pure audio).

2. **MOCK TEST MODE:** Timed simulation, Real exam format, Full scoring, Performance report

**Value for Each Stakeholder:**

| Stakeholder | Value Delivered |
|-----------|------------------|
| Learners | Personalized learning pathway, Spider Chart visualizing competency, Sliding Window for actual progress tracking |
| Instructors | Hybrid Grading reducing marking workload, student tracking dashboard, data-driven feedback |
| Educational Organizations | Scalable digital transformation tool, cost-efficient, multi-profile user management |

**Social Contributions (Long-term Goals):**

| Contribution | Description |
|----------|-------|
| Educational Accessibility | Reducing cost barriers: VSTEP exam fees lower than IELTS/TOEFL |
| Learning Efficiency | Supporting learners in narrowing skill gaps through adaptive learning |
| Remote Area Support | Mobile-first design for regions with limited internet infrastructure |
| Workforce Preparation | Supporting students in achieving foreign language graduation standards |

## 6. Project Scope & Limitations

### 6.1 Major Features

**Overview:** 16 features divided into 2 phases to ensure delivery within the 4-month timeline.

---

**PHASE 1 - MVP (Months 1-3): 11 Core Features**

*Focusing on learning experience and AI Grading*

FE-01: User Authentication - Registration, login, profile management with Learner/Instructor/Admin roles. Supporting email/password and OAuth (Google) authentication.

FE-02: Placement Test - Initial proficiency assessment for four skills (Listening, Speaking, Reading, Writing). Results used to initialize Spider Chart and recommend appropriate learning pathways.

FE-03: Practice Mode - Listening - Listening skill practice with Adaptive Scaffolding (Full text - Highlight - Pure audio). Including exercise types: dictation, multiple choice, content summarization.

FE-04: Practice Mode - Reading - Reading skill practice with VSTEP-format question types: True/False/Not Given, Multiple Choice, Matching Headings, Fill in the Blanks.

FE-05: Practice Mode - Writing + AI Grading - Writing skill practice with AI immediate feedback. Using LLM API (GPT/Gemini) to evaluate grammar, vocabulary, coherence, and task achievement according to VSTEP rubric. Supporting Task 1 (email) and Task 2 (essay).

FE-06: Practice Mode - Speaking + AI Grading - Speaking skill practice with recording and AI feedback. Integrating Speech-to-Text for transcription, then using LLM to evaluate pronunciation, fluency, and content. Including all 3 VSTEP Speaking parts.

FE-07: Mock Test Mode - Full four-skill mock test following VSTEP format and timing. Results compiled into detailed reports with scores per skill.

FE-08: Human Grading - Instructor interface for scoring with VSTEP rubric. Instructor reviews Writing/Speaking submissions, provides detailed comments, and can override AI scores if necessary.

FE-09: Progress Tracking - Spider Chart displaying four-skill competency, Sliding Window for progress tracking (average of 10 most recent exercises).

FE-10: Learning Path - Personalized learning pathway based on Placement Test results and progress. MVP uses rule-based logic: lowest-scoring skill prioritized for exercise recommendations. Phase 2 may upgrade to AI-based (ML/Collaborative Filtering) when sufficient user data is available.

FE-11: Goal Setting - Goal (B1/B2/C1) and timeline establishment. Learners set specific goals (e.g., B2 in 3 months). System displays progress toward goals and predicts achievement likelihood based on current learning pace.

---

**PHASE 2 - Enhancement (Month 4): 5 Admin & Support Features**

*Completing administrative features after core features stabilize*

FE-12: Content Management - Admin manages question bank and exam sets. Supporting import/export in standard formats (Excel, JSON). Admin can create, edit, and categorize questions by skill, topic, and difficulty level.

FE-13: User Management - Admin manages accounts and permissions. Including functions: bulk account creation, account locking/unlocking, password reset, and role assignment.

FE-14: Analytics Dashboard - Statistical reporting for Instructors and Admin. Displaying metrics: active user count, assignment completion rate, average score by skill. Supporting time-based filtering and report export.

FE-15: Notification System - Learning reminders and exam results notifications. Supporting push notification (mobile), email, and in-app notification.

FE-16: Advanced Admin Features - Advanced features: activity history viewing, automatic assignment distribution, notification frequency customization.

### 6.2 Limitations & Exclusions

LI-01: The system supports only VSTEP format (B1-B2, B2-C1), not other English proficiency tests (IELTS, TOEFL, TOEIC). This decision aims to focus development resources and ensure 100% alignment with official VSTEP test structure. Expansion to other tests will be considered in future versions based on market demand.

LI-02: AI Grading for Writing and Speaking is a supportive tool, not a complete replacement for Instructor assessment for official grades. AI scores are used for practice and rapid feedback purposes, while official scores (mock test final score) require Instructor review and confirmation. This ensures reliability of productive skill assessment results.

LI-03: MVP version supports only Vietnamese as the primary interface language. The primary target audience is Vietnamese VSTEP candidates, therefore Vietnamese is prioritized to reduce accessibility barriers. Multi-language support (English) will be added in subsequent versions.

LI-04: Mobile App development targets Android only in the initial phase, with iOS to be added later. According to statistics, Android holds over 70% of smartphone market share in Vietnam, therefore prioritized for initial development. iOS users can still access full functionality through Progressive Web App (PWA).

LI-05: The system does not integrate online payment in the MVP version. The pilot phase will apply freemium model or offline payment through partners (language centers). Payment gateway integration (VNPay, MoMo, ZaloPay) will be implemented when scaling commercially.

# III. References

[^1]: Bộ Giáo dục và Đào tạo. (2015). *Quyết định số 729/QĐ-BGDĐT ngày 11/03/2015 về việc ban hành Định dạng đề thi đánh giá năng lực sử dụng tiếng Anh theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam*.

[^2]: Bộ Giáo dục và Đào tạo. (2014). *Thông tư số 01/2014/TT-BGDĐT ngày 24/01/2014 ban hành Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam*.

[^3]: Thủ tướng Chính phủ. (2022). *Quyết định số 131/QĐ-TTg ngày 25/01/2022 phê duyệt Đề án "Tăng cường ứng dụng công nghệ thông tin và chuyển đổi số trong giáo dục và đào tạo giai đoạn 2022-2025, định hướng đến năm 2030"*.

[^4]: HolonIQ. (2024). *Global EdTech Market to reach $404B by 2025*. Retrieved from https://www.holoniq.com/edtech

[^5]: Cục Quản lý chất lượng - Bộ Giáo dục và Đào tạo. (2025, tháng 3). *Danh sách các đơn vị tổ chức thi đánh giá năng lực tiếng Anh theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam*. Retrieved from https://vqa.moet.gov.vn

[^6]: IMARC Group. (2025). *Vietnam EdTech Market Size, Share and Growth Trends 2034*. Retrieved from https://www.imarcgroup.com/vietnam-edtech-market

[^7]: IMARC Group. (2025). *Vietnam Digital English Language Learning Market Report 2024-2033*. Retrieved from https://www.imarcgroup.com/vietnam-digital-english-language-learning-market

[^8]: Wei, L. (2023). Artificial intelligence in language instruction: impact on English learning achievement, L2 motivation, and self-regulated learning. *Frontiers in Psychology*, 14, 1261955. https://doi.org/10.3389/fpsyg.2023.1261955

[^9]: Liu, Y., & Zu, Y. (2024). Design and Implementation of Adaptive English Learning System Integrating Language Contexts. *Journal of Educational Systems*, 4293.

[^10]: Nguyen, T. H., et al. (2025). Unravelling Success in AI-Powered Personalized Learning in Vietnam: A Study on the Interplay of Platform Features and Psychological Responses. *Informing Science: The International Journal of an Emerging Transdiscipline*, 28. https://www.informingscience.org/Publications/5668

[^11]: Ken Research. (2025). *Vietnam Adaptive Learning Market 2019-2030*. Retrieved from https://www.kenresearch.com/vietnam-adaptive-learning-market

[^12]: Prep Education. (2025). *Virtual Speaking Room - AI Speaking Practice*. Retrieved from https://prepedu.com/en/news/prep-ai-virtual-speaking-room

[^13]: DataReportal. (2026). *Digital 2026: Vietnam*. Retrieved from https://datareportal.com/reports/digital-2026-vietnam

[^14]: VietNamNet. (2025). *Vietnam's edtech market surges with AI-driven, locally adapted platforms*. Retrieved from https://vietnamnet.vn/en/vietnam-s-edtech-market-surges-with-ai-driven-locally-adapted-platforms-2424532.html

## Appendix A: Use Case Diagram

(Diagram to be added in Report 2 - SRS)

## Appendix B: System Architecture Overview

(Diagram to be added in Report 2 - SRS)

## Appendix C: Project Timeline

| Task Package | Description | Start | End |
|--------------|-------------|-------|-----|
| TP1 | Web Application Development | 01/01/2026 | 28/02/2026 |
| TP2 | Mobile Application Development | 15/01/2026 | 15/03/2026 |
| TP3 | Assessment Engine | 01/02/2026 | 31/03/2026 |
| TP4 | Personalized Learning Module | 15/02/2026 | 15/04/2026 |
| TP5 | Testing & Deployment | 01/04/2026 | 30/04/2026 |

(End of file)
