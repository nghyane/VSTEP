# CAPSTONE PROJECT REPORT

# Report 6 - Software User Guides

- Ho Chi Minh, May 2026 -

## Table of Contents

I. Record of Changes

II. Release Package & User Guides

1. Deliverable Package

2. Installation Guides

2.1 System Requirements

2.1.1 Hardware Requirements

2.1.2 Software Requirements

2.2 Installation Instruction

3. User Manual

3.1 Overview

3.2 Workflow 1: Learner uses VSTEP practice and course features

3.3 Workflow 2: Admin manages system content, exams, users, and courses

3.4 Workflow 3: Staff supports content, exams, courses, leave requests, and user access

3.5 Workflow 4: Teacher manages teaching schedule, bookings, and leave requests

3.6 Workflow 5: Learner uses mobile application features

## I. Record of Changes

| Date | A*M, D | In charge | Change Description |
|---|---|---|---|
| 31-May-26 | A | VSTEP Team | Init Report 6 - Software User Guides document |
| 31-May-26 | M | VSTEP Team | Added staff workflow and complete staff-admin screenshot evidence |
| 31-May-26 | M | VSTEP Team | Added mobile learner workflow and mobile screenshot evidence |

*A - Added M - Modified D - Deleted*

## II. Release Package & User Guides

## 1. Deliverable Package

| No. | Deliverable Item | Description |
|---:|---|---|
| 1 | Project Schedule/Tracking | Project plan, sprint tracking, progress notes, meeting notes, and team coordination documents maintained during development. |
| 2 | Project Backlog | Product backlog, sprint backlog, user stories, implementation tasks, and acceptance notes maintained by the team. |
| 3 | Source Codes | Source code stored in the VSTEP repository, including `apps/backend-v2`, `apps/frontend-v3`, `apps/admin`, and `apps/mobile-v2`. |
| 4 | Database Script(s) | Laravel migrations, seeders, factories, and database setup scripts stored in `apps/backend-v2/database`. |
| 5 | Final Report Document | Capstone report documents and generated report deliverables stored under `docs/capstone/reports`. |
| 6 | Test Cases Document | Test cases, manual test evidence, and screenshots for major learner, admin, staff, and teacher workflows where applicable. |
| 7 | Defects List | Defects recorded during implementation, testing, and review. |
| 8 | Issues List | Technical issues, project issues, and resolved implementation notes recorded during development. |
| 9 | Slide | Final presentation slides for project defense. |

Main source code packages:

| Package | Path | Description |
|---|---|---|
| Backend API | `apps/backend-v2` | Laravel 13 API for authentication, learner practice, exams, courses, bookings, teacher schedule, admin management, grading, and data persistence. |
| Learner Web | `apps/frontend-v3` | React 19 learner-facing web application for dashboard, practice, exams, courses, bookings, profile, and learning support features. |
| Admin Web | `apps/admin` | React 19 admin panel for content management, exam management, grading rubrics, users, courses, schedules, enrollments, bookings, and teacher workflows. |
| Mobile App | `apps/mobile-v2` | Expo React Native application for mobile learner experience. |

## 2. Installation Guides

## 2.1 System Requirements

## 2.1.1 Hardware Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Internet Connection | Stable Wi-Fi or LAN | Stable broadband connection |
| Processor | Dual-core CPU | Multi-core CPU |
| Memory | 8GB RAM | 16GB RAM or higher for running several services at the same time |
| Storage | 20GB free space | 40GB free space or higher for source code, dependencies, database, and emulator data |

## 2.1.2 Software Requirements

| Name / Version | Description |
|---|---|
| Windows 10 or higher | Operating system for local development and testing. |
| Git | Version control tool for cloning and managing source code. |
| Visual Studio Code | Code editor for frontend, backend, and documentation. |
| Node.js | Runtime for JavaScript tooling. |
| Bun | Package manager and runtime used by web applications. |
| PHP 8.4 | Target runtime for Laravel backend development. |
| Composer | PHP dependency manager. |
| PostgreSQL | Main relational database. |
| Redis | Queue/cache service used by backend features. |
| Docker Desktop | Optional local service runner for database and supporting services. |
| Android Studio | Required for Android emulator and mobile testing. |
| Expo tooling / Expo Go | Used for running and testing the mobile application. |
| Browser | Latest Chrome, Edge, or Firefox for web application testing. |
| Postman | Optional API testing tool. |
| Draw.io | Diagramming tool for architecture and workflow diagrams. |

Application stack summary:

| Application | Main Technology | Development Command |
|---|---|---|
| Backend API | PHP 8.4, Laravel 13, PostgreSQL, Redis, jwt-auth, Octane/FrankenPHP | `php artisan serve` or Laravel Octane command |
| Learner Web | Bun, Vite 8, React 19, TanStack Router, TanStack Query, Tailwind v4 | `bun run dev` |
| Admin Web | Bun, Vite 8, React 19, TanStack Router, TanStack Query, Ant Design v6 | `bun run dev` |
| Mobile App | Expo 54, React Native 0.81, Expo Router, TanStack Query | `bun run start` |

## 2.2 Installation Instruction

This section describes how to install and run the VSTEP system locally. Exact environment values can be adjusted by `.env` and `.env.example` files in each application. Installation screenshots will be inserted after manual capture.

### 2.2.1 Install Required Tools

1. Install Git from `https://git-scm.com/downloads`.
2. Install Visual Studio Code from `https://code.visualstudio.com/download`.
3. Install Node.js from `https://nodejs.org`.
4. Install Bun from `https://bun.sh`.
5. Install PHP 8.4 and Composer for Laravel backend development.
6. Install PostgreSQL and Redis, or prepare equivalent local services by Docker Desktop.
7. Install Android Studio and Expo Go only when testing the mobile application locally.

Add manual installation screenshots here after capture:

- Git installation and `git --version`.
- Node.js installation and `node --version`.
- Bun installation and `bun --version`.
- PHP and Composer installation.
- PostgreSQL, Redis, or Docker service setup.
- Android Studio and Expo setup.

### 2.2.2 Clone Source Code

Open terminal in the target folder and run:

```bash
git clone <project-repository-url>
cd VSTEP
```

After cloning, open the repository in Visual Studio Code and install dependencies for each active application separately. The active applications are isolated by folder and communicate through the backend API contract.

### 2.2.3 Backend Setup

1. Open `apps/backend-v2`.
2. Install backend dependencies with Composer.
3. Create the environment file from the sample configuration.
4. Configure database connection, Redis, JWT, mail, storage, payment, and AI provider values in `.env` based on `.env.example`.
5. Run migrations and seeders.
6. Start the Laravel backend server.

Example commands:

```bash
cd apps/backend-v2
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Common local backend URL: `http://localhost:8000`. If the backend is started with a different port, update the web and mobile environment files accordingly.

For local development with Octane/FrankenPHP and queue/log workers, use the backend development command configured in `composer.json` when the environment supports it.

### 2.2.4 Learner Web Setup

1. Open `apps/frontend-v3`.
2. Install dependencies.
3. Configure the API URL in the environment file.
4. Start the development server.

Example commands:

```bash
cd apps/frontend-v3
bun install
bun run dev
```

The learner web application uses the backend API through `VITE_API_URL`. Use the value from `apps/frontend-v3/.env.example` as the baseline and adjust it to match the running backend URL when necessary. Open the local Vite URL shown in the terminal after the command starts.

Learner web result:

![Learner web home](../../report6-screenshots/00-installation/01-user-web-home.png)

### 2.2.5 Admin Web Setup

1. Open `apps/admin`.
2. Install dependencies.
3. Configure the API URL in the environment file.
4. Start the development server.

Example commands:

```bash
cd apps/admin
bun install
bun run dev
```

Default admin web URL in the current development setup: `http://localhost:5180`.

Seed accounts used for local verification are provided by the backend seed data. Credentials may be reset by the development team before demonstration.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@vstep.test` | Local seed password |
| Teacher | `teacher@vstep.test` | Local seed password |

### 2.2.6 Mobile Setup

1. Open `apps/mobile-v2`.
2. Install dependencies.
3. Configure `EXPO_PUBLIC_API_URL` to point to the running backend.
4. Start Expo.
5. Open the application on Android emulator or Expo Go.

Example commands:

```bash
cd apps/mobile-v2
bun install
bun run start
```

For Android emulator testing, start Android Studio Device Manager first, launch a virtual device, then open the Expo application from the terminal prompt.

## 3. User Manual

## 3.1 Overview

VSTEP is an exam practice platform for learners preparing for VSTEP English tests. The system supports learner practice, course enrollment, exam preparation, AI-assisted learning activities, admin management, and teacher scheduling.

Main user groups:

| User Group | Main Functions |
|---|---|
| Learner | Register, login, practice skills, learn vocabulary and grammar, enroll in courses, book 1-1 slots, manage profile. |
| Admin | Manage content, exams, rubrics, users, courses, schedules, enrollments, bookings, and system data. |
| Staff | Support assigned admin operations such as content review, exam and course monitoring, leave-request handling, and restricted user access. |
| Teacher | View dashboard, manage teaching schedule, view bookings, and create leave requests. |

Main workflows:

1. Learner uses VSTEP practice and course features.
2. Admin manages system content, exams, users, and courses.
3. Staff supports content, exams, courses, leave requests, and user access.
4. Teacher manages teaching schedule, bookings, and leave requests.
5. Learner uses mobile application features.

## 3.2 Workflow 1: Learner uses VSTEP practice and course features

### Purpose

This workflow guides learners through account access, dashboard review, practice activities, course enrollment, booking, and profile management.

### Step 1: Login or register

Learners open the web application and use the login modal to access their account.

![Learner login modal](../../report6-screenshots/01-learner-auth/01-login-modal.png)

New learners can create an account from the register modal.

![Learner register modal](../../report6-screenshots/01-learner-auth/02-register-modal.png)

### Step 2: View learner dashboard

After login, the learner can view dashboard information and learning progress.

![Learner dashboard](../../report6-screenshots/02-learner-dashboard/01-dashboard-overview.png)

### Step 3: Open practice hub

The practice hub provides entry points for VSTEP practice skills and learning modules.

![Practice hub](../../report6-screenshots/03-learner-practice/01-practice-hub.png)

### Step 4: Practice listening, reading, writing, and speaking

Learners choose a skill and open the practice detail page.

![Listening practice](../../report6-screenshots/03-learner-practice/02-listening-practice.png)

![Reading practice](../../report6-screenshots/03-learner-practice/03-reading-practice.png)

![Writing practice](../../report6-screenshots/03-learner-practice/04-writing-practice.png)

![Speaking practice](../../report6-screenshots/03-learner-practice/05-speaking-practice.png)

### Step 5: Use vocabulary, grammar, and AI practice tools

Learners can review flashcards, complete word-fill exercises, study grammar, and use speaking support activities.

![Vocabulary flashcards](../../report6-screenshots/03-learner-practice/06-vobFlascard.png)

![Flashcard detail](../../report6-screenshots/03-learner-practice/07-flashcarDetail.png)

![Word fill exercise](../../report6-screenshots/03-learner-practice/08-Wordfill.png)

![Grammar practice](../../report6-screenshots/03-learner-practice/09-Grammar.png)

![Shadowing feedback](../../report6-screenshots/03-learner-practice/15-shadowingFeedback.png)

![Conversation practice](../../report6-screenshots/03-learner-practice/17-ConversationFull.png)

### Step 6: Explore and enroll in courses

Learners can browse available courses and open course details.

![Course explore](../../report6-screenshots/06-learner-course-flow/01-course-explore-initial-state.png)

![Course detail not enrolled](../../report6-screenshots/06-learner-course-flow/03-course-detail-not-enrolled.png)

Learners confirm enrollment from the action dialog.

![Course action dialog](../../report6-screenshots/06-learner-course-flow/04-course-detail-action-dialog.png)

After enrollment, the course appears in the learner's courses tab.

![My courses tab](../../report6-screenshots/06-learner-course-flow/05-my-courses-tab.png)

### Step 7: Book a learning slot

Learners select an available slot and confirm the booking.

![Booking action](../../report6-screenshots/06-learner-course-flow/08-booking-after-action-click.png)

![Booking schedule](../../report6-screenshots/06-learner-course-flow/09-bookingschedule.png)

![Booking detail](../../report6-screenshots/06-learner-course-flow/10-booking-detail.png)

![Booking success](../../report6-screenshots/06-learner-course-flow/13-successfull.png)

### Step 8: Manage profile and other learner utilities

Learners can view and update profile information, create a new profile, redeem coupons, and use account utilities.

![Learner profile](../../report6-screenshots/05-learner-profile/01-profile.png)

![Edit profile](../../report6-screenshots/05-learner-profile/02-edit.png)

![Create profile](../../report6-screenshots/05-learner-profile/03-createNewProfile.png)

![Redeem coupon](../../report6-screenshots/05-learner-profile/05-redeemcoupon.png)

![Learner notifications](../../report6-screenshots/11-other/02-notication.png)

![Learner streak](../../report6-screenshots/11-other/03-streak.png)

## 3.3 Workflow 2: Admin manages system content, exams, users, and courses

### Purpose

This workflow guides admin and staff users through login, dashboard review, content management, exam management, grading rubrics, user management, and course management.

### Step 1: Login to admin panel

Admin users login with authorized admin, staff, or teacher accounts.

![Admin login](../../report6-screenshots/06-admin-auth/01-admin-login.png)

### Step 2: View admin dashboard

The dashboard provides system overview information for administrators.

![Admin dashboard](../../report6-screenshots/07-admin-dashboard/01-dashboard-overview.png)

### Step 3: Manage learning content

Admin users manage vocabulary, grammar, and practice content for all four VSTEP skills.

![Vocabulary management](../../report6-screenshots/08-admin-content-management/01-vocab-management.png)

![Grammar management](../../report6-screenshots/08-admin-content-management/02-grammar-management.png)

![Listening management](../../report6-screenshots/08-admin-content-management/03-listening-management.png)

![Reading management](../../report6-screenshots/08-admin-content-management/04-reading-management.png)

![Writing management](../../report6-screenshots/08-admin-content-management/05-writing-management.png)

![Speaking management](../../report6-screenshots/08-admin-content-management/06-speaking-management.png)

Content can be created and updated from management screens.

![Create vocabulary](../../report6-screenshots/08-admin-content-management/07-createVob.png)

![Update content](../../report6-screenshots/08-admin-content-management/08-upadate.png)

### Step 4: Manage exams

Admin users can view, search, filter, create, import, and delete exam records.

![Exam management](../../report6-screenshots/09-admin-exam-management/01-exam-management.png)

![Exam search empty](../../report6-screenshots/09-admin-exam-management/02-exam-search-empty.png)

![Exam published filter](../../report6-screenshots/09-admin-exam-management/03-exam-filter-published.png)

![Create exam modal](../../report6-screenshots/09-admin-exam-management/04-exam-create-modal.png)

![Import exam modal](../../report6-screenshots/09-admin-exam-management/06-exam-import-modal.png)

![Delete exam confirmation](../../report6-screenshots/09-admin-exam-management/08-exam-delete-confirm.png)

### Step 5: Manage exam version content

Admin users manage Listening, Reading, Writing, and Speaking content inside each exam version.

![Exam detail listening](../../report6-screenshots/09-admin-exam-management/09-exam-detail-listening.png)

![Add listening question](../../report6-screenshots/09-admin-exam-management/11-listening-add-question-modal.png)

![Exam detail reading](../../report6-screenshots/09-admin-exam-management/14-exam-detail-reading.png)

![Edit reading passage](../../report6-screenshots/09-admin-exam-management/17-reading-edit-passage-modal.png)

![Exam detail writing](../../report6-screenshots/09-admin-exam-management/19-exam-detail-writing.png)

![Edit writing task](../../report6-screenshots/09-admin-exam-management/21-writing-edit-task-modal.png)

![Exam detail speaking](../../report6-screenshots/09-admin-exam-management/23-exam-detail-speaking.png)

![Edit speaking part](../../report6-screenshots/09-admin-exam-management/25-speaking-edit-part-modal.png)

### Step 6: View grading rubrics

Admin users can view grading rubrics and inspect detailed criteria.

![Grading rubric list](../../report6-screenshots/09-admin-exam-management/27-grading-rubric-list.png)

![Grading rubric filter](../../report6-screenshots/09-admin-exam-management/28-grading-rubric-filter-writing-active.png)

![Grading rubric detail](../../report6-screenshots/09-admin-exam-management/29-grading-rubric-detail.png)

![Grading criterion expanded](../../report6-screenshots/09-admin-exam-management/30-grading-rubric-criterion-expanded.png)

### Step 7: Manage users

Admin users can view and manage accounts in the system.

![User management](../../report6-screenshots/10-admin-user-management/01-user-management.png)

### Step 8: Manage courses, schedules, enrollments, slots, and bookings

Admin users can manage course records and related course operations.

![Course list](../../report6-screenshots/admin-course-management/02-courses-list.png)

![Course search empty](../../report6-screenshots/admin-course-management/03-courses-search-empty.png)

![Course create modal](../../report6-screenshots/admin-course-management/06-course-create-modal-empty.png)

![Course detail info](../../report6-screenshots/admin-course-management/09-course-detail-info.png)

![Course schedule tab](../../report6-screenshots/admin-course-management/10-course-schedule-tab.png)

![Course schedule create modal](../../report6-screenshots/admin-course-management/11-course-schedule-create-modal.png)

![Course enrollments tab](../../report6-screenshots/admin-course-management/14-course-enrollments-tab.png)

![Enrollment signature](../../report6-screenshots/admin-course-management/17-course-enrollment-signature.png)

![Course slots tab](../../report6-screenshots/admin-course-management/19-course-slots-tab.png)

![Bulk slot modal](../../report6-screenshots/admin-course-management/20-course-slots-bulk-modal.png)

![Course bookings tab](../../report6-screenshots/admin-course-management/24-course-bookings-tab.png)

![Edit booking meet URL](../../report6-screenshots/admin-course-management/26-course-bookings-edit-meet-url.png)

## 3.4 Workflow 3: Staff supports content, exams, courses, leave requests, and user access

### Purpose

This workflow guides staff users through the admin portal areas available for operational support. Staff users can review the dashboard, support learning-content maintenance, monitor exams and courses, handle leave-request information, and are restricted from unauthorized user-management actions.

### Step 1: View staff dashboard

After login, staff users are redirected to the staff-accessible admin dashboard.

![Staff dashboard](../../report6-screenshots/staff-admin-20260531/01-staff-dashboard.png)

### Step 2: Support vocabulary content

Staff users can open vocabulary management to review and support vocabulary content operations.

![Staff vocabulary management](../../report6-screenshots/staff-admin-20260531/02-staff-vocabulary.png)

### Step 3: Support grammar content

Staff users can open grammar management to review and support grammar content operations.

![Staff grammar management](../../report6-screenshots/staff-admin-20260531/03-staff-grammar.png)

### Step 4: Monitor exams

Staff users can access exam management screens for operational exam review.

![Staff exam management](../../report6-screenshots/staff-admin-20260531/04-staff-exams.png)

### Step 5: Monitor courses

Staff users can access course management screens to support course operations.

![Staff course management](../../report6-screenshots/staff-admin-20260531/05-staff-courses.png)

### Step 6: Review leave requests

Staff users can review leave-request information from the admin portal.

![Staff leave requests](../../report6-screenshots/staff-admin-20260531/06-staff-leave-requests.png)

### Step 7: Confirm restricted user management access

When staff users attempt to access unauthorized user-management functionality, the system redirects them away from the restricted area.

![Staff user management redirected](../../report6-screenshots/staff-admin-20260531/07-staff-users-redirected.png)

## 3.5 Workflow 4: Teacher manages teaching schedule, bookings, and leave requests

### Purpose

This workflow guides teacher users through dashboard review, schedule inspection, booking review, and leave request creation.

### Step 1: Login as teacher

Teacher users login with a teacher account. The system redirects teacher users to the teacher dashboard.

![Teacher login](../../report6-screenshots/13-teacher-flow/01-teacher-login.png)

### Step 2: View teacher dashboard

The teacher dashboard summarizes today's teaching slots, upcoming bookings, and pending leave requests.

![Teacher dashboard](../../report6-screenshots/13-teacher-flow/02-teacher-dashboard.png)

### Step 3: View weekly teaching schedule

Teachers can view weekly class and 1-1 teaching events.

![Teacher schedule all](../../report6-screenshots/13-teacher-flow/03-teacher-schedule-all.png)

Teachers can open a class detail modal.

![Teacher class detail](../../report6-screenshots/13-teacher-flow/04-teacher-schedule-class-detail.png)

Teachers can filter 1-1 slots and open slot details.

![Teacher slot filter](../../report6-screenshots/13-teacher-flow/05-teacher-schedule-slot-filter.png)

![Teacher slot detail](../../report6-screenshots/13-teacher-flow/06-teacher-schedule-slot-detail.png)

Teachers can also filter classes or move to the next week.

![Teacher class filter](../../report6-screenshots/13-teacher-flow/07-teacher-schedule-class-filter.png)

![Teacher next week](../../report6-screenshots/13-teacher-flow/08-teacher-schedule-next-week.png)

### Step 4: View bookings

Teachers can view student bookings and meeting links.

![Teacher bookings](../../report6-screenshots/13-teacher-flow/09-teacher-bookings-list.png)

### Step 5: Manage leave requests

Teachers can view leave requests and create a new request.

![Teacher leave requests](../../report6-screenshots/13-teacher-flow/10-teacher-leave-requests-list.png)

![Teacher leave create modal](../../report6-screenshots/13-teacher-flow/11-teacher-leave-create-modal.png)

The form validates required date input.

![Teacher leave validation](../../report6-screenshots/13-teacher-flow/12-teacher-leave-create-validation.png)

Teachers fill in the date and reason before sending the request.

![Teacher leave filled](../../report6-screenshots/13-teacher-flow/13-teacher-leave-create-filled.png)

## 3.6 Workflow 5: Learner uses mobile application features

### Purpose

This workflow guides learners through the mobile application experience, including app startup, authentication, dashboard review, practice modules, exams, profile utilities, and course-related screens.

### Step 1: Open mobile application

Learners launch the mobile application from an Android emulator or mobile device after starting Expo.

![Mobile installation screen 1](../../report6-screenshots/anh_mobile/00-installation/00-installation (1).jpg)

![Mobile installation screen 2](../../report6-screenshots/anh_mobile/00-installation/00-installation (2).jpg)

![Mobile installation screen 3](../../report6-screenshots/anh_mobile/00-installation/00-installation (3).jpg)

### Step 2: Login or register on mobile

Learners authenticate with an existing account or create a new account from the mobile authentication screens.

![Mobile learner auth 1](../../report6-screenshots/anh_mobile/01-learner-auth/01-learner-auth (1).jpg)

![Mobile learner auth 2](../../report6-screenshots/anh_mobile/01-learner-auth/01-learner-auth (2).jpg)

### Step 3: Review mobile dashboard

After login, learners can review dashboard information, learning shortcuts, and mobile navigation entries.

![Mobile learner dashboard 1](../../report6-screenshots/anh_mobile/02-learner-dashboard/02-learner-dashboard (1).jpg)

![Mobile learner dashboard 2](../../report6-screenshots/anh_mobile/02-learner-dashboard/02-learner-dashboard (2).jpg)

![Mobile learner dashboard 3](../../report6-screenshots/anh_mobile/02-learner-dashboard/02-learner-dashboard (3).jpg)

![Mobile learner dashboard 4](../../report6-screenshots/anh_mobile/02-learner-dashboard/02-learner-dashboard (4).jpg)

![Mobile learner dashboard 5](../../report6-screenshots/anh_mobile/02-learner-dashboard/02-learner-dashboard (5).jpg)

![Mobile learner dashboard 6](../../report6-screenshots/anh_mobile/02-learner-dashboard/02-learner-dashboard (6).jpg)

### Step 4: Practice learning modules on mobile

Learners can access practice modules and complete learning activities from the mobile practice area.

![Mobile learner practice 1](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (1).jpg)

![Mobile learner practice 2](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (2).jpg)

![Mobile learner practice 3](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (3).jpg)

![Mobile learner practice 4](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (4).jpg)

![Mobile learner practice 5](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (5).jpg)

![Mobile learner practice 6](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (6).jpg)

![Mobile learner practice 7](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (7).jpg)

![Mobile learner practice 8](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (8).jpg)

![Mobile learner practice 9](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (9).jpg)

![Mobile learner practice 10](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (10).jpg)

![Mobile learner practice 11](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (11).jpg)

![Mobile learner practice 12](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (12).jpg)

![Mobile learner practice 13](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (13).jpg)

![Mobile learner practice 14](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (14).jpg)

![Mobile learner practice 15](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (15).jpg)

![Mobile learner practice 16](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (16).jpg)

![Mobile learner practice 17](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (17).jpg)

![Mobile learner practice 18](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (18).jpg)

![Mobile learner practice 19](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (19).jpg)

![Mobile learner practice 20](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (20).jpg)

![Mobile learner practice 21](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (21).jpg)

![Mobile learner practice 22](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (22).jpg)

![Mobile learner practice 23](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (23).jpg)

![Mobile learner practice 24](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (24).jpg)

![Mobile learner practice 25](../../report6-screenshots/anh_mobile/03-learner-practice/03-learner-practice (25).jpg)

### Step 5: Take exams on mobile

Learners can open exam screens and complete mobile exam interactions.

![Mobile learner exam 1](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (1).jpg)

![Mobile learner exam 2](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (2).jpg)

![Mobile learner exam 3](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (3).jpg)

![Mobile learner exam 4](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (4).jpg)

![Mobile learner exam 5](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (5).jpg)

![Mobile learner exam 6](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (6).jpg)

![Mobile learner exam 7](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (7).jpg)

![Mobile learner exam 8](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (8).jpg)

![Mobile learner exam 9](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (9).jpg)

![Mobile learner exam 10](../../report6-screenshots/anh_mobile/04-learner-exam/04-learner-exam (10).jpg)

### Step 6: Manage profile on mobile

Learners can review and update account profile information from mobile screens.

![Mobile learner profile 1](../../report6-screenshots/anh_mobile/05-learner-profile/05-learner-profile (1).jpg)

![Mobile learner profile 2](../../report6-screenshots/anh_mobile/05-learner-profile/05-learner-profile (2).jpg)

![Mobile learner profile 3](../../report6-screenshots/anh_mobile/05-learner-profile/05-learner-profile (3).jpg)

![Mobile learner profile 4](../../report6-screenshots/anh_mobile/05-learner-profile/05-learner-profile (4).jpg)

### Step 7: Use course flow on mobile

Learners can browse course-related mobile screens and continue course learning activities.

![Mobile learner course flow 1](../../report6-screenshots/anh_mobile/06-learner-course-flow/06-learner-course-flow (1).jpg)

![Mobile learner course flow 2](../../report6-screenshots/anh_mobile/06-learner-course-flow/06-learner-course-flow (2).jpg)

![Mobile learner course flow 3](../../report6-screenshots/anh_mobile/06-learner-course-flow/06-learner-course-flow (3).jpg)

![Mobile learner course flow 4](../../report6-screenshots/anh_mobile/06-learner-course-flow/06-learner-course-flow (4).jpg)

![Mobile learner course flow 5](../../report6-screenshots/anh_mobile/06-learner-course-flow/06-learner-course-flow (5).jpg)
