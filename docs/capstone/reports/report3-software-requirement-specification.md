# I. Record of Changes

| Date | A/M/D | In charge | Change Description |
| --- | --- | --- | --- |
| 2026-05-29 | A |  | Create VSTEP Software Requirement Specification from current implementation. |

*A - Added   M - Modified   D - Deleted*

# II. Software Requirement Specification

## 1. Product Overview

The VSTEP Adaptive Learning System is a capstone project for adaptive VSTEP exam preparation. It supports learner onboarding, vocabulary and grammar learning, four-skill practice, VSTEP mock exams, AI-supported writing and speaking feedback, wallet operations, course enrollment, one-on-one teacher booking, teacher workspace, staff content management and administrative operations.

Context diagram: the diagram below shows the VSTEP Platform boundary and its interactions with learners, staff/admin, teachers and external services.

![Figure 1](assets/report3/image001.png)

## 2. User Requirements

### 2.1 Actors

| # | Actor | Description |
| --- | --- | --- |
| 1 | Guest | Unauthenticated visitor who can register, log in and use Google sign-in. |
| 2 | Learner | Primary user with active learning profile for study, practice, mock exam, wallet, course, booking, notifications and progress. |
| 3 | Teacher | Instructor role for dashboard, teaching schedule, bookings and leave requests. |
| 4 | Staff | Operations/content role for courses, learning content, draft exams, teacher slots, enrollments, bookings and leave request review. |
| 5 | Admin | Highest privileged role for users, system config, promo codes, top-up packages, exams and admin dashboard. |
| 6 | AI Provider | External/system actor used by writing/speaking AI feedback, conversation and pronunciation review. |
| 7 | Payment Gateway | External payment system that receives top-up orders and sends payment confirmations. |

### 2.2 Use Cases

#### 2.2.1 Diagram(s)

#### Overview:

![Figure 2](assets/report3/image002.png)

Learner:

![Figure 3](assets/report3/image003.png)

Teacher:

![Figure 4](assets/report3/image004.png)

Admin:

![Figure 5](assets/report3/image005.png)

Staff:

![Figure 6](assets/report3/image006.png)

#### 2.2.2 Descriptions

| ID | Use Case | Actors | Use Case Description |
| --- | --- | --- | --- |
| UC-L01 | Register | Guest | Create a new learner account with email/password and initial onboarding data. |
| UC-L02 | Login | Guest, Learner, Teacher, Staff, Admin | Authenticate user credentials and return role-appropriate session data. |
| UC-L03 | Logout | Authenticated user | Invalidate current session tokens and clear client authentication state. |
| UC-L04 | Refresh Token | Authenticated user | Use refresh token to receive a new access token without re-login. |
| UC-L05 | Create Profile | Learner | Create a new learning profile with target level and deadline. |
| UC-L06 | Manage Profile | Learner | View and update learner profile information. |
| UC-L07 | Switch Profile | Learner | Change active profile so following APIs use the selected learning context. |
| UC-L08 | Complete Onboarding | Learner | Finish onboarding information and receive welcome coin bonus when applicable. |
| UC-L09 | Change Password / Avatar | Learner | Change account password and upload/update profile avatar. |
| UC-L10 | View Wallet Balance | Learner | View current coin balance in header/profile wallet UI. |
| UC-L11 | Top Up Coins | Learner, Payment Gateway | Select top-up package, create payment order and redirect to payment URL. |
| UC-L12 | Redeem Promo Code | Learner | Submit promo code and receive coins if the code is valid. |
| UC-L13 | Credit Coins to Wallet | Payment Gateway, System | Credit coins after validated payment confirmation or successful promo redemption. |
| UC-L14 | Deduct Coins | Learner, System | Deduct coins for exam session start or paid booking actions. |
| UC-L15 | Study Vocabulary (Spaced Repetition) | Learner | Browse vocabulary topics and study words with adaptive review scheduling. |
| UC-L16 | Practice Vocab Exercises | Learner | Answer vocabulary exercises such as MCQ/fill blank and view feedback. |
| UC-L17 | Vocabulary Review Queue | Learner | Review due vocabulary cards and update the next review time based on learner rating. |
| UC-L18 | Study Grammar | Learner | Browse grammar points, examples, mistakes, tips and exercises. |
| UC-L19 | Practice Listening/Reading | Learner | Open listening/reading MCQ exercises, answer questions and view results. |
| UC-L20 | Practice Writing | Learner, AI Provider | Write practice response, submit, trigger AI feedback and view result. |
| UC-L21 | Practice Speaking (VSTEP) | Learner, AI Provider | Record VSTEP speaking task responses and submit for AI scoring. |
| UC-L22 | Practice Pronunciation (Drill) | Learner, AI Provider | Complete pronunciation drill and receive audio/pronunciation feedback. |
| UC-L23 | AI Conversation Roleplay | Learner, AI Provider | Start conversation scenario, submit turns and receive conversation feedback. |
| UC-L24 | Practice Shadowing | Learner | Listen, repeat/record shadowing content and save progress. |
| UC-L25 | Answer / Submit Practice | Learner | Submit answers or attempts for practice sessions and receive immediate/AI results. |
| UC-L26 | View Exam Result History | Learner | View submitted exam/practice result history from learner screens. |
| UC-L27 | Start Exam Session | Learner | Start full/custom exam session after checking coin balance and selected skills. |
| UC-L28 | Submit Exam | Learner | Submit exam manually or through auto-submit when time expires. |
| UC-L29 | Auto-grade L/R | System | Automatically calculate listening/reading MCQ scores after exam submission. |
| UC-L30 | AI Feedback W/S | AI Provider, System | Generate writing/speaking scores and feedback asynchronously. |
| UC-L31 | View Results & Feedback | Learner | View score summary, pending AI status, feedback and result detail. |
| UC-L32 | View Progress Overview | Learner | View dashboard overview cards, skill progress and recent activity. |
| UC-L33 | View Streak | Learner | View streak state, milestones and claim available rewards. |
| UC-L34 | View Learning Path | Learner | View weak-skill recommendations and suggested exercises. |
| UC-L35 | View Notifications | Learner | Open notification bell/list and mark notifications as read. |
| UC-L36 | View Courses | Learner | Browse available courses and course detail information. |
| UC-L37 | Enroll in Course | Learner | Create course enrollment order and confirm enrollment flow. |
| UC-L38 | Book 1-on-1 Session | Learner, Teacher | Book teacher slot with coin deduction and booking constraints. |
| UC-T01 | View Teacher Dashboard | Teacher | View teacher summary dashboard in teacher workspace. |
| UC-T02 | View Teaching Schedule | Teacher | View assigned course schedule and teaching calendar. |
| UC-T03 | View Bookings / Request Leave | Teacher | View 1-on-1 bookings and create leave requests. |
| UC-A01 | View Admin Dashboard | Staff, Admin | View statistics, alerts, analytics, content status and recent activity. |
| UC-A02 | Manage Users | Admin | Search, create, view and update users by role. |
| UC-A03 | Activate / Deactivate Users | Admin | Deactivate or reactivate accounts according to admin-only permission. |
| UC-A04 | Manage Topup Packages | Admin | Create/update/activate/deactivate wallet top-up packages. |
| UC-A05 | Manage Promo Codes | Admin | Create, edit and list promo codes for coin redemption. |
| UC-A06 | Manage System Config | Admin | View and update system configuration keys. |
| UC-A07 | Monitor AI Feedback Queue | Staff, Admin | View AI feedback alerts, throughput and failed jobs from admin dashboard. |
| UC-A08 | Publish / Unpublish Exam | Staff, Admin | Publish or unpublish an exam so learners can/cannot access it. |
| UC-A09 | Create / Update Exam | Staff, Admin | Create/import/update exam metadata, versions and skill content. |
| UC-S01 | Manage Courses | Staff, Admin | Create/update/publish courses and manage course detail tabs. |
| UC-S02 | Manage Teaching Slots | Staff, Admin | Create/update/delete teacher slots for 1-on-1 booking. |
| UC-S03 | View Enrollments | Staff, Admin | View and manage course enrollments and commitment override. |
| UC-S04 | Manage Vocab Topics | Staff, Admin | Create/update/publish vocabulary topics, words and exercises. |
| UC-S05 | Manage Grammar Points | Staff, Admin | Create/update/publish grammar points and child content. |
| UC-S06 | Manage Listening Exercises | Staff, Admin | Create/update/publish listening exercises and questions. |
| UC-S07 | Manage Reading Exercises | Staff, Admin | Create/update/publish reading exercises and questions. |
| UC-S08 | Manage Writing Prompts | Staff, Admin | Create/update/publish writing prompts and markers. |
| UC-S09 | Manage Speaking Tasks | Staff, Admin | Create/update/publish VSTEP speaking tasks. |
| UC-S10 | Manage Speaking Drills | Staff, Admin | Create/update/publish speaking drills and drill sentences. |
| UC-S11 | Manage Exams (draft) | Staff, Admin | Manage draft exams and versions before publishing. |
| UC-S12 | Review Leave Requests | Staff | Approve or reject teacher leave requests. |
| UC-S13 | View Admin Notifications | Teacher, Staff, Admin | View admin-shell notifications and unread count. |

## 3. Functional Requirements

### 3.1 System Functional Overview

The functional overview covers learner-facing study and exam flows, admin and staff management screens, teacher workspace, and backend integration services.

#### 3.1.1 Screens Flow

![Figure 7](assets/report3/image007.png)

#### 3.1.2 Screen Descriptions

| # | Feature | Screen | Description |
| --- | --- | --- | --- |
| 1 | Register | Register | Register learner with email, onboarding data |
| 2 | Login | Login | Login with email/password, session, redirect |
| 3 | Google Login | Google Auth | Google Sign-In integration |
| 4 | Session & Refresh | Session | Token refresh, logout, lifecycle |
| 5 | Profile CRUD | Profile | List, create, switch, update, onboarding |
| 6 | Vocabulary & Spaced Repetition | Vocabulary | Topic list, detail, exercises, due-card review |
| 7 | Grammar Points | Grammar | Point list, detail, exercise flow |
| 8 | Listening Practice | Listening | Exercise list, audio, answer, results |
| 9 | Reading Practice | Reading | Exercise list, passage, questions, results |
| 10 | Writing Practice | Writing | Prompt, editor, submit, AI feedback, live status updates |
| 11 | Speaking Drills | Speaking Drills | Pronunciation drill, recording, feedback |
| 12 | VSTEP Speaking | VSTEP Speaking | VSTEP session, submit, scoring/feedback |
| 13 | Conversation | Conversation AI | Scenario start, turns, review, feedback |
| 14 | Shadowing | Shadowing | Shadowing session, playback, recording |
| 15 | Exam Library & Detail | Exam Library | List, status cards, detail, skill selector |
| 16 | Start Exam Session | Exam Start | Full/custom start, coin, insufficient balance |
| 17 | Draft Autosave | Exam Draft | Save, autosave debounce, resume from draft |
| 18 | Exam Room Panels | Exam Panels | L/R/W/S panels, device check |
| 19 | Transition & Submit | Exam Submit | Next skill, confirm, submit, auto-submit, scoring |
| 20 | Exam Result | Exam Result | Result summary, feedback, polling, detail page |
| 21 | Wallet Balance | Wallet Balance | Balance endpoint, header display |
| 22 | Top-up & Payment | Top-up | Package list, order, confirm, redirect |
| 23 | Promo Redemption | Promo Redeem | Valid/invalid redeem, frontend, error |
| 24 | Dashboard & Progress | Dashboard | Overview, spider chart, streak, learning path |
| 25 | Course Enrollment | Course Enroll | List, enrollment order, frontend flow |
| 26 | Booking & Notification | Booking | Book slot, coin, limit, commitment, notifications |
| 27 | Admin Dashboard | Admin Dashboard | Stats, alerts, role enforcement, frontend |
| 28 | Admin Vocab & Grammar | Admin Vocab Grammar | Vocab/grammar CRUD, publish/unpublish, frontend |
| 29 | Admin Settings | Admin Settings | System config, update, role enforcement |
| 30 | Admin Exam Management | Admin Exams | Exam CRUD, import, version, content editors |
| 31 | Admin Practice Content | Admin Practice | L/R/W/S exercise CRUD, editors |
| 32 | Admin User Management | Admin Users | User CRUD, deactivate, role enforcement, frontend |
| 33 | Admin Course & Promo | Admin Courses | Course CRUD, enrollments, bookings, promo, top-up |
| 34 | Teacher | Teacher | Dashboard, schedule, bookings, leave requests |
| 35 | AI Feedback | AI Feedback | Result lookup, live status updates, scoring formulas, processing flow |
| 36 | System Integration | System | Role hierarchy, health, config, cross-module |
| 37 | Non-functional | Non-functional | Security, performance, compatibility, usability, reliability |

#### 3.1.3 Screen Authorization

| Screen | Guest | Learner | Teacher / Staff | Admin |
| --- | --- | --- | --- | --- |
| Landing, Register, Login | X |  |  |  |
| Dashboard, Profile, Wallet, Promo |  | X |  |  |
| Vocabulary, Grammar, Practice Skills |  | X |  |  |
| Exam Library, Exam Room, Result |  | X |  |  |
| Courses and 1-on-1 Booking |  | X |  |  |
| Teacher Dashboard, Schedule, Bookings, Leave Requests |  |  | X |  |
| Staff Content/Course/Exam Management |  |  | X |  |
| User Management |  |  |  | X |
| System Configuration |  |  |  | X |
| Promo Codes and Top-up Packages |  |  |  | X |

#### 3.1.4 Non-Screen Functions

| # | Feature | System Function | Description |
| --- | --- | --- | --- |
| 1 | Authentication | Token refresh and role middleware | Issue/refresh/revoke tokens and enforce role hierarchy plus active profile context. |
| 2 | Wallet | Payment confirmation and transaction | Validate provider confirmation, credit coins and create wallet transactions. |
| 3 | Vocabulary | Spaced-repetition scheduler | Compute due cards, review intervals and vocabulary memory states. |
| 4 | Writing/Speaking | AI feedback processing | Create AI feedback jobs, call the AI provider, and store feedback with processing status. |
| 5 | AI Feedback | Live feedback stream | Stream AI feedback progress, processing status and completion events. |
| 6 | Exam | Draft autosave | Persist and restore exam answers, active skill index and speaking marks. |
| 7 | Progress | Streak and learning path | Update streak, grant milestone coins and recommend weak skills. |
| 8 | System | Health/config endpoints | Expose system health and configuration. |

#### 3.1.5 Entity Relationship Diagram

The entity relationship diagrams below provide the latest VSTEP data model grouped by functional domain. Each page is exported from the current Entity Relationship Diagram source.

Auth & Profile:

![Figure 8](assets/report3/image008.png)

Wallet:

![Figure 9](assets/report3/image009.png)

Commerce:

![Figure 10](assets/report3/image010.png)

Vocabulary & Spaced Repetition:

![Figure 11](assets/report3/image011.png)

Grammar:

![Figure 12](assets/report3/image012.png)

Listening & Reading:

![Figure 13](assets/report3/image013.png)

Writing:

![Figure 14](assets/report3/image014.png)

Speaking Practice:

![Figure 15](assets/report3/image015.png)

Exam Content:

![Figure 16](assets/report3/image016.png)

Exam Session:

![Figure 17](assets/report3/image017.png)

AI Feedback & Progress:

![Figure 18](assets/report3/image018.png)

Assessment Engine:

![Figure 19](assets/report3/image019.png)

Feedback Requests:

![Figure 20](assets/report3/image020.png)

Speaking Conversation:

![Figure 21](assets/report3/image021.png)

Orders & Operations:

![Figure 22](assets/report3/image022.png)

Entities Description

| # | Entity | Description |
| --- | --- | --- |
| 1 | User | Account identity with role such as learner, teacher, staff or admin. |
| 2 | Profile | Learning profile owned by a user and used as active study/payment context. |
| 3 | Wallet / WalletTransaction | Coin balance and transaction history. |
| 4 | Vocabulary Topic / Word / Review State | Vocabulary content and spaced-repetition review state. |
| 5 | GrammarPoint | Grammar content and exercises. |
| 6 | PracticeExercise / PracticeSession | Listening/reading MCQ exercises and sessions. |
| 7 | WritingPrompt / WritingSubmission | Writing prompt, submitted text and feedback. |
| 8 | SpeakingDrill / SpeakingTask / ConversationSession | Speaking drill, VSTEP speaking and AI conversation data. |
| 9 | Exam / ExamVersion / ExamSession | VSTEP mock exam structure, session, draft and result. |
| 10 | AI Feedback Job | Asynchronous job used to process AI feedback requests. |
| 11 | Course / Enrollment / TeacherBooking | Course catalog, enrollment and 1-on-1 booking. |
| 12 | PromoCode / TopupPackage / TopupOrder | Commerce configuration and payment order data. |
| 13 | Notification / SystemConfig | Notifications and runtime configuration. |

### 3.2 Core Functional Features

#### 3.2.1 Learner Study, Practice and Exam Flows

Function trigger: learner navigation and form/action submission from public pages, authenticated learner routes, practice modules, exam room and course pages.

Function description: learner functions support authentication, profile and target management, practice, exam attempts, AI feedback, course enrollment, wallet-related actions and booking flows. The frontend sends requests to backend APIs using the active profile context and displays validation messages or state feedback returned by the system.

Screen layout: representative VSTEP learner screenshots are shown below. Each screenshot is followed by function details covering data, validation, business rules, normal flows and exception flows.

Learner login modal and authentication entry point

![Figure 23](assets/report3/image023.png)

Trigger: learner opens the public web application and selects login. Description: the authentication interface collects learner credentials and starts the session for the selected user role. Details: the system validates required fields and credential correctness, creates an authenticated session on success, and returns field-level or credential errors for abnormal cases without exposing sensitive account data.

Learner dashboard overview and progress summary

![Figure 24](assets/report3/image024.png)

Trigger: learner signs in and enters the learner dashboard. Description: the dashboard summarizes active profile, target level, progress, streak, study activity and recommended next actions. Details: dashboard data is loaded from the active profile; empty or incomplete profile states are handled by guiding the learner to create or update a profile before continuing.

Learner profile and target management

![Figure 25](assets/report3/image025.png)

Trigger: learner opens the profile area from the account menu. Description: the profile screen shows personal information, active learning profile, target level and account actions. Details: profile data must belong to the authenticated learner; updates require valid input, and target changes are controlled by creating or selecting profiles rather than silently modifying historical learning records.

Practice hub for VSTEP skill practice

![Figure 26](assets/report3/image026.png)

Trigger: learner navigates to the practice module. Description: the hub groups listening, reading, writing, speaking, vocabulary and grammar practice activities. Details: practice actions create drill attempts, update study time and streak where applicable, and route learners to skill-specific screens; locked, missing-content and unauthorized states are handled with clear UI feedback.

Actual exam-taking screen with answer selection

![Figure 27](assets/report3/image027.png)

Trigger: learner starts a valid exam session after readiness checks. Description: the focused exam room presents questions, audio or reading material, answer controls, timing and section navigation. Details: the system saves selected answers against the exam attempt, prevents invalid section access, respects time limits, and handles abnormal cases such as missing answers, expired sessions or blocked navigation.

Exam device check before focused exam session

![Figure 28](assets/report3/image028.png)

Trigger: learner chooses to enter an exam session. Description: the device check confirms readiness before the exam room is opened. Details: required permissions and device availability are validated first; if microphone, speaker or browser conditions fail, the system prevents entry and guides the learner to resolve the issue before starting.

Exam result detail and AI feedback

![Figure 29](assets/report3/image029.png)

Trigger: learner submits an exam and opens the result detail page after AI feedback processing is completed. Description: the result view presents scores, strengths, improvements and rewrite/feedback information. Details: graded exam data is read from the submitted attempt; pending, failed or unavailable feedback states are handled separately so learners do not see incomplete or misleading scores.

Enrolled course detail and learning schedule

![Figure 30](assets/report3/image030.png)

Trigger: learner opens a course after enrollment. Description: the course detail screen shows course information, schedule and booking-related actions. Details: enrollment status and booking capacity are checked before actions are allowed; normal cases show available learning sessions while abnormal cases such as not enrolled, full slots or invalid booking requests are blocked with clear feedback.

Function details: learner flows use authenticated profile data, target level, course enrollment records, practice attempts, exam attempts, answer submissions and AI feedback results. Normal cases allow learners to continue the learning or exam flow; abnormal cases such as missing profile, insufficient permission, expired exam session, invalid booking, unavailable AI feedback or invalid form input are blocked with clear system feedback.

#### Representative Mobile Screen Layouts

The mobile application follows the same learner journey as the web client. To keep the document concise and aligned with the sample report structure, the section below includes representative mobile screen layouts only, covering authentication, dashboard, practice, mock exam, profile, and course flows.

| Mobile layout 1. Login and learner authentication | Mobile layout 2. Dashboard and progress overview |
| --- | --- |
| Mobile layout 3. Practice hub and recommendations | Mobile layout 4. Speaking/practice activity |
| Mobile layout 5. Mock exam entry flow | Mobile layout 6. Mock exam result flow |
| Mobile layout 7. Learner profile and account | Mobile layout 8. Course exploration and booking |

These layouts are provided as screen evidence for the mobile learner flows; detailed behavior remains described in the screen description, authorization, and functional feature sections.

#### 3.2.2 Admin, Staff and Teacher Operations

Function trigger: authorized admin, staff or teacher users navigate to the back-office dashboard and management modules after login.

Function description: back-office functions support operational dashboards, user administration, course management, content management, exam management, schedules, bookings, leave requests, notifications and reports. The interface is role-based, and backend authorization determines which operations each actor can execute.

Screen layout: representative VSTEP admin, staff and teacher operation screens are shown below. Each screenshot is followed by the required function details.

Admin dashboard and operational analytics

![Figure 31](assets/report3/image031.png)

Trigger: admin signs in and opens the admin dashboard. Description: the dashboard summarizes users, learning activity, revenue or operational metrics and system status. Details: data is filtered by the admin role and loaded from backend analytics endpoints; unavailable metrics or empty datasets must render stable empty states instead of causing page errors.

User management and account administration

![Figure 32](assets/report3/image032.png)

Trigger: admin navigates to user management. Description: this function supports reviewing learner, teacher, staff and admin accounts, including status and role-related operations. Details: only authorized administrators can change account states; validation prevents invalid role/status updates and abnormal cases such as self-locking or unauthorized access are rejected by the backend.

Vocabulary content management

![Figure 33](assets/report3/image033.png)

Trigger: admin opens the vocabulary content module. Description: the screen lists vocabulary items and supports creating, updating, searching and organizing vocabulary content. Details: required fields such as word, meaning, level and metadata are validated; duplicate, incomplete or invalid content submissions are rejected while successful changes become available to the relevant learner practice flows.

Exam management workspace

![Figure 34](assets/report3/image034.png)

Trigger: admin opens exam management. Description: administrators configure fixed VSTEP exam content and manage exam-related resources. Details: exam data must remain consistent across sections, questions and answer keys; invalid configurations, missing content or unauthorized edits are blocked to protect learner exam sessions.

Course detail and course operations

![Figure 35](assets/report3/image035.png)

Trigger: admin opens a course detail page from course management. Description: the course workspace supports course metadata, schedule, enrollment and booking operations. Details: course status, capacity, time ranges and enrollment rules are validated; normal operations update course records while conflicting schedules, invalid capacity or unauthorized changes are rejected.

Staff course operation flow

Trigger: authorized staff opens Course Management from the back-office sidebar after login.

Description: this flow supports course operation tasks such as checking course information, reviewing schedules, managing class/booking slots, monitoring bookings and updating meeting links for learner sessions.

Screen layout: selected staff/back-office course operation screens are shown below. The screenshots are representative evidence only, so the document remains concise while still showing the implemented workflow.

| Staff layout 1. Course list, search, filters and status overview | Staff layout 2. Course detail information and operational metadata |
| --- | --- |
| Staff layout 3. Course schedule review and management | Staff layout 4. Available teaching/booking slot management |
| Staff layout 5. Course booking monitoring and status review | Staff layout 6. Booking meeting-link update for learner session support |

Details: staff actions are constrained by backend authorization and validation rules. Normal cases allow staff to review and maintain operational course data; abnormal cases such as missing permission, invalid schedule data, full slots, duplicate bookings or unsafe meeting-link updates are rejected and shown with clear messages.

Teacher dashboard overview

![Figure 36](assets/report3/image036.png)

Trigger: teacher signs in and opens the teacher dashboard. Description: the dashboard summarizes today's teaching sessions, upcoming bookings and pending leave requests for the teacher role. Details: teacher data is scoped to the authenticated teacher; the screen supports quick navigation to schedule, bookings and leave-request operations.

Teacher weekly schedule management

![Figure 37](assets/report3/image037.png)

Trigger: teacher opens the schedule module from the teacher sidebar. Description: the schedule view shows class sessions and 1-on-1 slots by week, course and schedule type. Details: teachers can review assigned teaching sessions and upcoming slots; filters must not expose schedules outside the teacher's assigned scope.

Teacher booking list

![Figure 38](assets/report3/image038.png)

Trigger: teacher opens the booking module. Description: the booking list shows learners who booked 1-on-1 sessions with course, time, meeting URL and booking status. Details: only bookings assigned to the current teacher are visible; missing meeting links or cancelled bookings are shown as controlled states.

Teacher leave request management

![Figure 39](assets/report3/image039.png)

Trigger: teacher opens the leave request screen. Description: teachers can review submitted leave requests and create new requests when they cannot teach assigned sessions. Details: leave requests require valid date/time and reason data; staff or admin review controls determine approval status and operational follow-up.

Admin and staff notification center

![Figure 40](assets/report3/image040.png)

Trigger: admin or staff opens system notifications from the back-office header. Description: the notification panel lists operational events such as booking changes, system updates or review tasks. Details: notifications use recipient scope and duplicate-prevention keys so repeated jobs or payment confirmations do not create duplicate operational alerts.

Function details: administration functions use user records, roles, permissions, course data, exam content, practice content, schedules, bookings and operational metrics. Normal cases update or display managed resources; abnormal cases such as invalid data, duplicate content, unauthorized role access, conflicting schedules or unsafe account changes are rejected and reported through the UI.

### 3.3 Backend Services and Integrations

Function trigger: backend services run when clients call REST APIs, submit practice or exam data, initiate payment flows, receive payment confirmations, request AI feedback, stream feedback updates or trigger notifications.

Function description: backend services include token-based authentication, role hierarchy, active profile context, payment confirmation handling, wallet transaction consistency, AI feedback processing, live status streaming, notification generation, health/config endpoints and spaced-repetition scheduling for vocabulary learning.

Trigger: backend services are invoked by web/mobile clients, scheduled jobs, payment confirmations, AI feedback requests and notification events. Description: the architecture connects frontend, admin, mobile, Laravel backend services, database, AI provider, payment gateway and notification channels. Details: API endpoints enforce authentication, active profile context, role authorization, transaction consistency and error handling; abnormal cases such as failed payment confirmations, AI feedback errors or permission violations are logged and returned as controlled API responses.

Function details: backend APIs use consistent response contracts, request validation, role authorization, database transactions and integration-specific error handling. Normal cases return the requested resource or accepted processing state; exception flows such as invalid credentials, inactive profile, failed payment verification, AI provider failure, invalid payment confirmation payload or unauthorized access return controlled errors and preserve data consistency.

## 4. Non-Functional Requirements

### 4.1 External Interfaces

The VSTEP system exposes learner web, admin/staff/teacher web, learner mobile application and backend REST API interfaces. Protected API calls use bearer-token authentication and active profile context where learner data is required.

External integrations include PayOS payment gateway for wallet top-up, AI provider for writing and speaking feedback, browser speech recognition or speech services for speaking input where applicable, media storage for uploaded audio/images, and notification channels for in-app reminders and operational events.

All API responses must follow the agreed response envelope and return controlled validation or authorization errors. Financial, personal and AI-feedback data exchanged with external services must be validated before it is persisted or shown to the user.

### 4.2 Quality Attributes

Quality attributes are defined from the VSTEP project scope, current backend/frontend implementation, and Report 5 verification scope. The highest-risk areas are authentication, role authorization, exam submission, scoring/feedback, wallet/payment, profile ownership and course booking.

#### 4.2.1 Usability

The learner UI must be usable without special training and must use clear learner-facing messages for authentication, profile setup, practice, exam, wallet and course flows.

Focused exam and practice screens must reduce accidental navigation, show progress/timer/status clearly, and provide confirmation when an action may lose data or leave the flow.

The system must provide predictable loading, empty, success and error states. Admin/staff screens must support search/filter/pagination for large content or user lists.

The web interface must be responsive for common desktop and mobile widths; the mobile application must support learner practice, progress, notifications and learning materials on the go.

#### 4.2.2 Reliability

The system must preserve data consistency for active profile context, exam submit, draft autosave/restore, AI feedback jobs, wallet transactions, course enrollment and booking state.

Payment confirmations, course confirmations and booking cancellation/refund flows must be repeat-safe. A repeated confirmation must not credit coins or create enrollments twice.

Exam submission must be atomic: MCQ answers, writing/speaking submissions, AI feedback jobs, session status and draft cleanup must not leave a partially corrupted result.

AI feedback failures must be visible as pending or failed states and must not overwrite valid previous feedback. The system must keep enough job/status information for retry or support investigation.

Critical defect definition: unauthorized access, wrong wallet balance, lost exam submission, duplicated payment/enrollment, corrupted AI feedback or inaccessible core learner exam/practice flow.

#### 4.2.3 Performance

Common authenticated API requests should respond within 2 seconds under local/staging capstone test conditions. Pages must show loading states while server data is being fetched.

AI feedback and recommendation flows target near-real-time responses within the capstone scope; when external AI processing is slower than the target, the UI must show pending/live-status/polling status instead of blocking the user without feedback.

The system must remain stable when multiple learners practice, submit exams, view dashboards, top up wallets or book teacher slots concurrently in the seeded test environment.

Capacity target for the capstone increment is seeded project data: learners, profiles, exams, vocab/grammar/practice content, courses, bookings, AI feedback jobs, notifications and admin records.

Resource utilization must remain acceptable for Chrome-based frontend clients and Laravel API services using database transactions, queues and external AI/payment integrations.

#### 4.2.4 Security and Compatibility

All protected APIs require bearer token authentication. Learner routes that depend on study, wallet, exam, practice or course context require an active profile.

Role-based access control must prevent learner access to admin/staff/teacher APIs, prevent staff from executing admin-only configuration or user-status actions, and restrict teacher access to teacher workspace data.

Sensitive data such as passwords, refresh tokens, payment verification data, AI provider keys and private prompts must never be exposed to clients or stored in plain text where hashing/signature verification is required.

Payment confirmations must verify provider signatures/checksum before changing wallet or order state. Financial and personally identifiable data must be transmitted over HTTPS in deployed environments.

The learner web application targets modern Chrome-compatible browsers; speech/conversation features that depend on browser speech recognition must provide clear unsupported-browser feedback.

## 5. Requirement Appendix

Business rules, common requirements, application messages and scope notes are listed below. The rules are consolidated from Report 1 scope, project documents and current VSTEP backend/frontend behavior.

### 5.1 Business Rules

Business rules are consolidated from backend routes, services, project documentation and VSTEP product constraints. The wording below intentionally uses capstone-friendly terms; low-level implementation details are written as "safe concurrent update" and "repeat-safe processing".

| ID | Rule Definition |
| --- | --- |
| BR-01 | One account may own multiple learner profiles. A profile stores the learner's target, progress and study context, while the coin wallet belongs to the account and is shared across that account's profiles. |
| BR-02 | Learner APIs for study, exam, practice, wallet actions, courses, progress and notifications require an authenticated learner with an active profile. |
| BR-03 | Email/password login is allowed only when the account email has been verified and the account is not deactivated. |
| BR-04 | Google login is allowed only when Google confirms the email as verified. A new Google account must complete onboarding before learner features can be used. |
| BR-05 | If an email was registered but not verified, Google login is blocked to prevent someone from taking over that account. |
| BR-06 | Google-only accounts cannot use password reset until a password exists; they must use Google sign-in. |
| BR-07 | Refresh tokens are rotated after use and stored securely. Expired tokens or tokens for deactivated accounts are rejected. |
| BR-08 | Switching profile creates a new authenticated session for the selected profile. Actions using an old profile context must not affect the new active profile. |
| BR-09 | Each account has a maximum number of profiles based on system configuration, and profile nicknames must be unique within the same account. |
| BR-10 | The last profile of an account cannot be deleted. A profile reset clears learning progress only, not wallet, payment, course or enrollment history. |
| BR-11 | Profile target level and entry level are fixed learning baselines. To change the target, the learner creates or switches to another profile; an existing deadline may only be extended, not shortened. |
| BR-12 | No placement test is required during onboarding. Learners self-select a target level and may provide an entry level; the first graded mock exam becomes the real performance baseline. |
| BR-13 | The system supports VSTEP preparation only, using four skills: listening, reading, writing and speaking. IELTS, TOEFL, TOEIC and other exam formats are outside scope. |
| BR-14 | Learners can see and start only published exams that have one active exam version. Draft exams or exams without an active version are not available to learners. |
| BR-15 | An exam version must pass VSTEP structure checks before it can become the active version. Only one version of the same exam can be active at a time. |
| BR-16 | Content of an active version in a published exam cannot be edited directly. A new version must be created when published exam content needs to change. |
| BR-17 | Full mock exam mode includes all four skills. Custom exam mode may include selected skills, but at least one valid VSTEP skill must be selected and duplicate skills are not allowed. |
| BR-18 | Exam price is read from system configuration: full exam cost for all four skills, and custom per-skill cost for selected skills. Custom exam cost must not exceed full exam cost. |
| BR-19 | Starting an exam requires enough coins and no unfinished active session for the same profile and exam version. The learner must continue, submit, expire or restart the existing session first. |
| BR-20 | Restarting an exam abandons the previous active session, removes its saved draft and creates a new paid attempt. |
| BR-21 | The server deadline is the official exam timer. Submission after the allowed grace period is rejected or handled as an expired session. |
| BR-22 | Exam draft autosave is only a recovery copy. Draft data can be saved and restored only while the session is active and before the deadline. |
| BR-23 | Listening and reading answer keys are hidden from learners during the exam. Only the selected answer is stored while the exam is in progress. |
| BR-24 | A listening section play record is saved only once per section and exam session, so repeated playback events do not create duplicate play records. |
| BR-25 | Listening and reading MCQ scoring uses the fixed number of questions in the selected skills. Unanswered questions count as incorrect. |
| BR-26 | Submitted MCQ item IDs, writing task IDs and speaking part IDs must belong to the selected exam version. Answers for unrelated exam content are rejected or ignored safely. |
| BR-27 | Speaking exam audio must be uploaded under the current profile and exam-speaking context. Missing or unrelated audio files are rejected. |
| BR-28 | Empty writing answers do not create AI grading jobs and are treated as no submitted answer for that task. Missing speaking parts receive no score for that part. |
| BR-29 | Writing and speaking submissions create AI assessment jobs. The score is not considered ready until the job finishes successfully. Pending or failed jobs must be shown clearly. |
| BR-30 | A custom exam that does not include all four skills can show skill results, but it cannot show a complete VSTEP overall band. |
| BR-31 | Full-exam overall band is calculated from listening, reading, writing and speaking scores, rounded to the nearest 0.5 band. |
| BR-32 | VSTEP level mapping follows the configured 0-10 scale: below 4.0 is not counted as B1, 4.0-5.5 is B1, 6.0-8.0 is B2, and 8.5-10.0 is C1. |
| BR-33 | Writing final score uses the VSTEP writing formula: Task 1 and Task 2 are combined with Task 2 having double weight. |
| BR-34 | Speaking score uses the configured VSTEP speaking criteria, including grammar, vocabulary, fluency, discourse management and pronunciation. |
| BR-35 | AI-assisted feedback is learning support only. It must not be presented as an official VSTEP certificate or official certification result. |
| BR-36 | Assessment results must keep criterion scores, overall band, evidence summary, score limits applied and calculation explanation so the result can be reviewed. |
| BR-37 | Active scoring criteria are selected by skill and task type. Historical results keep the scoring criteria used at the time they were graded. |
| BR-38 | Active scoring criteria or criteria already used by historical results cannot be edited directly. Admins must clone a draft version and activate it when changes are needed. |
| BR-39 | A learner may request teacher grading only after the AI assessment result is available for that writing or speaking attempt. |
| BR-40 | Each assessment attempt can have only one teacher grading request to prevent duplicate review workflows. |
| BR-41 | Staff/admin may assign only open teacher-grading requests, and the assigned user must be an active teacher account with an approved professional qualification for the relevant grading skill. |
| BR-42 | Teachers can view, start and submit only grading requests assigned to them. Teacher grading scores must follow the same 0-10 scoring range and rubric criteria. |
| BR-43 | Teacher grading results are stored separately from AI results and include a snapshot of the AI result. Teacher grading must not overwrite the original AI assessment. |
| BR-44 | Practice and drill attempts are separate from mock-exam attempts. Practice results support learning history and feedback but are not official mock-exam results. |
| BR-45 | A practice session can be submitted only once. Re-submission of an ended practice session is rejected. |
| BR-46 | Learners can access only published practice content. Draft listening, reading, writing, speaking, vocabulary and grammar content is hidden from learner screens. |
| BR-47 | Spaced-repetition scheduling applies only to vocabulary review cards. Grammar, listening, reading, writing, speaking and exam content are not scheduled this way. |
| BR-48 | Vocabulary review updates the card's learning state, difficulty/ease information and next due time according to the configured spaced-repetition algorithm. |
| BR-49 | Grammar mastery is calculated from practice attempts and correctness. Grammar does not use vocabulary spaced-repetition scheduling. |
| BR-50 | Conversation roleplay is practice support only. It checks vocabulary and grammar per turn, does not use the VSTEP speaking rubric and does not contribute to the mock-exam spider chart. |
| BR-51 | Starting a new conversation for the same scenario closes any previous active conversation session for that scenario and profile. |
| BR-52 | Conversation and pronunciation features must reject or redirect inappropriate language and return safe learning feedback. |
| BR-53 | Uploaded speaking audio is scoped by profile and purpose, such as practice-speaking or exam-speaking. Audio outside the allowed scope must not be accepted for grading. |
| BR-54 | Dashboard, streak, learning path and progress screens use the active profile context. They must not mix progress from another profile. |
| BR-55 | Daily activity and streak are based on completed learning activities recorded by the system, including practice, vocabulary review, conversation/shadowing and completed mock exams. |
| BR-56 | Streak milestone rewards can be claimed only once per account for each milestone. A repeated claim must not grant coins again. |
| BR-57 | The spider/radar chart is based on recent submitted mock-exam evidence. Missing skill data remains empty; the system must not invent scores. |
| BR-58 | Learning path and risk signals are rule-based, using available score, streak, deadline and trend data. They are not automatic prediction models. |
| BR-59 | Learner risk analytics must be treated as back-office information for teacher/staff/admin support and should not be presented as an official learner score. |
| BR-60 | Wallet balance is calculated from account coin transactions. The profile ID on a transaction records which learning profile caused the action. |
| BR-61 | Every coin credit or spend must create a wallet transaction record with amount, resulting balance, source and metadata for auditability. |
| BR-62 | Insufficient coin balance blocks paid exam, booking, practice feedback or other coin-spending actions before the action is completed. |
| BR-63 | Coin spending and crediting must be processed as safe concurrent updates, so two simultaneous requests cannot make the balance wrong. |
| BR-64 | Configurable costs such as exam cost, practice feedback cost and booking cost must come from backend configuration or course records, not hardcoded client values. |
| BR-65 | Top-up orders can be created only from active top-up packages. Package coins include base coins plus bonus coins. |
| BR-66 | PayOS is the current live payment provider. VNPay is not available for real payment until it is explicitly implemented and enabled. |
| BR-67 | Coins from top-up are credited only after the payment provider confirmation is verified. Failed, cancelled, expired or unverifiable payments must not change wallet balance. |
| BR-68 | Payment confirmation must be repeat-safe: if the same paid confirmation arrives more than once, coins or course enrollment are applied only once. |
| BR-69 | A top-up package that already has payment orders cannot be hard-deleted. Admins should deactivate it to hide it from learners. |
| BR-70 | Promo code redemption must validate code status, expiry time, total usage limit and per-account usage limit before crediting coins. |
| BR-71 | Promo code limits are checked by account to prevent a learner from using multiple profiles to farm the same code. |
| BR-72 | Course enrollment uses a VND payment order and learner commitment signature. Course purchase is not paid by coins in this increment. |
| BR-73 | Course enrollment is allowed only when the course is published, not ended, has remaining capacity, has a valid price and the profile is not already enrolled. |
| BR-74 | Course payment confirmation is repeat-safe. A paid order must not create duplicate enrollments or duplicate course bonus coins. |
| BR-75 | Unpublished courses are visible only to learners already enrolled in that course. Livestream/meeting information is hidden from non-enrolled learners. |
| BR-76 | A course cannot be deleted when it already has enrollments or payment orders. Published courses cannot share the same title. |
| BR-77 | Course schedule items and teacher slots must stay within the course start and end dates. |
| BR-78 | Teacher slots in the same course cannot have the same start time. A slot with an active booking cannot be edited or deleted until the booking is cancelled. |
| BR-79 | Course commitment status is computed from required full mock tests completed within the course commitment window: not enrolled, pending, met or violated. |
| BR-80 | Teacher booking requires active enrollment, commitment met, an open future slot, required lead time and remaining per-student booking quota. |
| BR-81 | Booking a teacher slot charges the configured booking coin cost and reserves the slot in one safe update, preventing another learner from booking the same slot. |
| BR-82 | Booking cancellation updates booking and slot status, refunds coins only once when applicable, and sends a clear notification. |
| BR-83 | If a booking is linked to a writing or speaking submission, that submission must belong to the active learner profile. |
| BR-84 | Teacher leave requests can be created only for today or a future date, and one teacher can have only one leave request for the same date. |
| BR-85 | Staff can approve or reject only pending leave requests. Approval or rejection records the reviewer and review time. |
| BR-86 | Role hierarchy is enforced by backend authorization: learners cannot access back-office APIs, staff cannot execute admin-only finance/config/user actions, and teachers are limited to teacher workspace data. |
| BR-87 | Admin-created user roles are fixed after creation. Admin users cannot create another admin through the normal user-management flow, and an admin cannot deactivate their own account. |
| BR-88 | When deactivating a teacher who still has active courses, those courses must be reassigned to another active teacher first. |
| BR-89 | System configuration can update only predefined configuration keys. Arbitrary new keys cannot be created from the admin UI. |
| BR-90 | Notifications are scoped to the correct learner profile or back-office user. Repeated payment, course, booking, grading or reward events must not create duplicate notifications. |
| BR-91 | The mobile learner app follows the same backend business rules as the learner web app; it is a different access channel, not a separate business process. |

### 5.2 Common Requirements

CR-01: Backend API responses must use a consistent envelope for successful data responses and controlled error payloads for validation, authorization and domain failures.

CR-02: Forms must validate required fields, maximum lengths, enum values, file type/size and ownership before data is persisted.

CR-03: All learner-owned resources must be filtered by authenticated user/profile ownership. A user must not read or mutate another profile's data.

CR-04: Admin/staff list screens must support safe search/filter/pagination for users, content, courses, exams, bookings and operational records.

CR-05: Deleting or cancelling records that affect money, enrollment, bookings or scoring/feedback must preserve an audit trail through status fields or transaction records.

CR-06: Date/time logic for streaks, deadlines, slots and reminders must use the configured timezone, defaulting to Asia/Ho_Chi_Minh.

CR-07: UI must never hide null/loading/error states by inventing fake data; it must display loading, empty or error state consistently.

CR-08: AI-assisted feedback must be treated as learning support and shown with the correct processing status. Pending or failed AI feedback must not be presented as final.

CR-09: Exam/practice screens must prevent accidental data loss by autosaving drafts where available and asking for confirmation on destructive navigation.

CR-10: Configuration values such as exam coin cost, chart thresholds, streak milestones, course capacity and booking cost must be read from backend configuration or course records, not hardcoded in clients.

CR-11: Notification and message text must be clear, user-actionable and consistent across learner/admin interfaces.

CR-12: The system must keep learner-facing Vietnamese interface language for the MVP scope while preserving English text for VSTEP prompts, learner answers and rewrites.

### 5.3 Application Messages List

| # | Message code | Message Type | Context | Content |
| --- | --- | --- | --- | --- |
| 1 | MSG-AUTH-01 | Inline / Toast | Login failed | Email or password is incorrect. |
| 2 | MSG-AUTH-02 | Toast | Session expired | Your session has expired. Please log in again. |
| 3 | MSG-AUTH-03 | Inline | Required auth field | Please enter your email and password. |
| 4 | MSG-PROF-01 | Toast | Onboarding completed | Welcome gift has been added to your wallet. |
| 5 | MSG-PROF-02 | Inline | No active profile | Please select or create a learning profile before continuing. |
| 6 | MSG-PROF-03 | Dialog | Switch target/profile | Changing target will use another learning profile. |
| 7 | MSG-WAL-01 | Inline | Insufficient coins | Your coin balance is not enough for this action. |
| 8 | MSG-WAL-02 | Popup | Promo redeemed | Promo code redeemed successfully. |
| 9 | MSG-WAL-03 | Status | Payment pending | Your payment is being verified. Please wait. |
| 10 | MSG-WAL-04 | Error | Payment failed | Payment verification failed. Your wallet was not charged. |
| 11 | MSG-EXAM-01 | Dialog | Leave exam | Are you sure you want to leave the exam room? |
| 12 | MSG-EXAM-02 | Overlay | Time expired | Time is up. Your exam will be submitted automatically. |
| 13 | MSG-EXAM-03 | Inline | Active session exists | You already have an unfinished attempt for this exam. |
| 14 | MSG-EXAM-04 | Status | Draft restored | Your previous exam draft has been restored. |
| 15 | MSG-EXAM-05 | Error | Expired session | This exam session has expired and can no longer be submitted. |
| 16 | MSG-WRI-01 | Inline | Writing too short | Your answer does not meet the minimum word requirement. |
| 17 | MSG-SPK-01 | Inline | Microphone unavailable | Please allow microphone access or check your browser settings. |
| 18 | MSG-GRD-01 | Status | AI feedback pending | Your feedback is being generated. Please wait. |
| 19 | MSG-GRD-02 | Error | AI feedback failed | We could not generate feedback. Please try again later. |
| 20 | MSG-COURSE-01 | Inline | Course full | This course has reached the maximum number of learners. |
| 21 | MSG-COURSE-02 | Inline | Duplicate enrollment | You have already enrolled in this course. |
| 22 | MSG-BOOK-01 | Inline | Commitment not met | Please complete the required full mock tests before booking a teacher slot. |
| 23 | MSG-BOOK-02 | Inline | Slot unavailable | This slot is no longer available. |
| 24 | MSG-BOOK-03 | Inline | Lead time violation | Please book at least the required number of hours before the slot starts. |
| 25 | MSG-SEC-01 | Error | Forbidden | You do not have permission to access this resource. |
| 26 | MSG-SYS-01 | Toast | Network/server error | Something went wrong. Please try again. |

### 5.4 Other Requirements

OR-01: The system supports VSTEP preparation and mock-exam practice only; IELTS, TOEFL, TOEIC and other exam formats are out of scope.

OR-02: Users self-select their target level/profile. There is no mandatory placement test at onboarding; the first graded mock exam becomes the real performance baseline.

OR-03: AI-assisted feedback is a supplementary practice tool. Official certification scores require authorized exam or instructor verification outside the system.

OR-04: Adaptive scheduling is limited to vocabulary spaced-repetition review. Other practice content is filtered by skill, part, level or recommendation but is not dynamically sequenced by that algorithm.

OR-05: Teacher functions focus on dashboard, schedule, bookings and leave requests. Assignment of custom exercises/modules to individual learners is not included in this increment.

OR-06: Predictive analytics uses rule-based risk signals such as band, streak, deadline proximity and trend direction; it is not an automatic prediction model.

OR-07: PayOS is the current live payment integration for wallet top-up and course enrollment. VNPay remains disabled until it is explicitly enabled in a later increment.

OR-08: External AI, speech, payment and notification services may be unavailable; the system must expose pending/failed states and avoid corrupting core learner records.
