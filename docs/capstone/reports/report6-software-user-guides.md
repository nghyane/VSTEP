# I. Record of Changes

| Date | A/M/D | In charge | Change Description |
| --- | --- | --- | --- |
| 31-May-26 | A | VSTEP Team | Init Report 6 - Software User Guides document |
| 31-May-26 | M | VSTEP Team | Added staff workflow and complete staff-admin screenshot evidence |
| 31-May-26 | M | VSTEP Team | Added mobile learner workflow and mobile screenshot evidence |

*A - Added   M - Modified   D - Deleted*

# II. Release Package & User Guides

## 1. Deliverable Package

| No. | Deliverable Item | Description |
| --- | --- | --- |
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
| --- | --- | --- |
| Backend API | `apps/backend-v2` | Laravel 13 API for authentication, learner practice, exams, courses, bookings, teacher schedule, admin management, grading, and data persistence. |
| Learner Web | `apps/frontend-v3` | React 19 learner-facing web application for dashboard, practice, exams, courses, bookings, profile, and learning support features. |
| Admin Web | `apps/admin` | React 19 admin panel for content management, exam management, grading rubrics, users, courses, schedules, enrollments, bookings, and teacher workflows. |
| Mobile App | `apps/mobile-v2` | Expo React Native application for mobile learner experience. |

## 2. Installation Guides

### 2.1 System Requirements

### 2.1.1 Hardware Requirements

| Requirement | Minimum | Recommended |
| --- | --- | --- |
| Internet Connection | Stable Wi-Fi or LAN | Stable broadband connection |
| Processor | Dual-core CPU | Multi-core CPU |
| Memory | 8GB RAM | 16GB RAM or higher for running several services at the same time |
| Storage | 20GB free space | 40GB free space or higher for source code, dependencies, database, and emulator data |

### 2.1.2 Software Requirements

| Name / Version | Description |
| --- | --- |
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
| --- | --- | --- |
| Backend API | PHP 8.4, Laravel 13, PostgreSQL, Redis, jwt-auth, Octane/FrankenPHP | `php artisan serve` or Laravel Octane command |
| Learner Web | Bun, Vite 8, React 19, TanStack Router, TanStack Query, Tailwind v4 | `bun run dev` |
| Admin Web | Bun, Vite 8, React 19, TanStack Router, TanStack Query, Ant Design v6 | `bun run dev` |
| Mobile App | Expo 54, React Native 0.81, Expo Router, TanStack Query | `bun run start` |

### 2.2 Installation Instruction

This section describes how to install and run the VSTEP system locally. Exact environment values can be adjusted by .env and .env.example files in each application. Installation screenshots will be inserted after manual capture.

2.2.1 Install Required Tools

1. Install Git from https://git-scm.com/downloads.

2. Install Visual Studio Code from https://code.visualstudio.com/download.

3. Install Node.js from https://nodejs.org.

4. Install Bun from https://bun.sh.

5. Install PHP 8.4 and Composer for Laravel backend development.

6. Install PostgreSQL and Redis, or prepare equivalent local services by Docker Desktop.

7. Install Android Studio and Expo Go only when testing the mobile application locally.

Add manual installation screenshots here after capture:

- Git installation and git --version.

- Node.js installation and node --version.

- Bun installation and bun --version.

- PHP and Composer installation.

- PostgreSQL, Redis, or Docker service setup.

- Android Studio and Expo setup.

2.2.2 Clone Source Code

Open terminal in the target folder and run:

git clone <project-repository-url> cd VSTEP

After cloning, open the repository in Visual Studio Code and install dependencies for each active application separately. The active applications are isolated by folder and communicate through the backend API contract.

2.2.3 Backend Setup

1. Open apps/backend-v2.

2. Install backend dependencies with Composer.

3. Create the environment file from the sample configuration.

4. Configure database connection, Redis, JWT, mail, storage, payment, and AI provider values in .env based on .env.example.

5. Run migrations and seeders.

6. Start the Laravel backend server.

Example commands:

cd apps/backend-v2 composer install cp .env.example .env php artisan key:generate php artisan migrate --seed php artisan serve

Common local backend URL: http://localhost:8000. If the backend is started with a different port, update the web and mobile environment files accordingly.

For local development with Octane/FrankenPHP and queue/log workers, use the backend development command configured in composer.json when the environment supports it.

2.2.4 Learner Web Setup

1. Open apps/frontend-v3.

2. Install dependencies.

3. Configure the API URL in the environment file.

4. Start the development server.

Example commands:

cd apps/frontend-v3 bun install bun run dev

The learner web application uses the backend API through VITE_API_URL. Use the value from apps/frontend-v3/.env.example as the baseline and adjust it to match the running backend URL when necessary. Open the local Vite URL shown in the terminal after the command starts.

Learner web result:

![Figure 1](assets/report6/image001.png)

Learner web home

2.2.5 Admin Web Setup

1. Open apps/admin.

2. Install dependencies.

3. Configure the API URL in the environment file.

4. Start the development server.

Example commands:

cd apps/admin bun install bun run dev

Default admin web URL in the current development setup: http://localhost:5180.

Seed accounts used for local verification are provided by the backend seed data. Credentials may be reset by the development team before demonstration.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@vstep.test` | Local seed password |
| Teacher | `teacher@vstep.test` | Local seed password |

2.2.6 Mobile Setup

1. Open apps/mobile-v2.

2. Install dependencies.

3. Configure EXPO_PUBLIC_API_URL to point to the running backend.

4. Start Expo.

5. Open the application on Android emulator or Expo Go.

Example commands:

cd apps/mobile-v2 bun install bun run start

For Android emulator testing, start Android Studio Device Manager first, launch a virtual device, then open the Expo application from the terminal prompt.

## 3. User Manual

### 3.1 Overview

VSTEP is an exam practice platform for learners preparing for VSTEP English tests. The system supports learner practice, course enrollment, exam preparation, AI-assisted learning activities, admin management, and teacher scheduling.

Main user groups:

| User Group | Main Functions |
| --- | --- |
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

### 3.2 Workflow 1

Purpose

This workflow guides learners through account access, dashboard review, practice activities, course enrollment, booking, and profile management.

Step 1: Login or register

Learners open the web application and use the login modal to access their account.

![Figure 2](assets/report6/image002.png)

Learner login modal

New learners can create an account from the register modal.

![Figure 3](assets/report6/image003.png)

Learner register modal

Step 2: View learner dashboard

After login, the learner can view dashboard information and learning progress.

![Figure 4](assets/report6/image004.png)

Learner dashboard

Step 3: Open practice hub

The practice hub provides entry points for VSTEP practice skills and learning modules.

![Figure 5](assets/report6/image005.png)

Practice hub

Step 4: Practice listening, reading, writing, and speaking

Learners choose a skill and open the practice detail page.

![Figure 6](assets/report6/image006.png)

Listening practice

![Figure 7](assets/report6/image007.png)

Reading practice

![Figure 8](assets/report6/image008.png)

Writing practice

![Figure 9](assets/report6/image009.png)

Speaking practice

Step 5: Use vocabulary, grammar, and AI practice tools

Learners can review flashcards, complete word-fill exercises, study grammar, and use speaking support activities.

![Figure 10](assets/report6/image010.png)

Vocabulary flashcards

![Figure 11](assets/report6/image011.png)

Flashcard detail

![Figure 12](assets/report6/image012.png)

Word fill exercise

![Figure 13](assets/report6/image013.png)

Grammar practice

![Figure 14](assets/report6/image014.png)

Shadowing feedback

![Figure 15](assets/report6/image015.png)

Conversation practice

Step 6: Explore and enroll in courses

Learners can browse available courses and open course details.

![Figure 16](assets/report6/image016.png)

Course explore

![Figure 17](assets/report6/image017.png)

Course detail not enrolled

Learners confirm enrollment from the action dialog.

![Figure 18](assets/report6/image018.png)

Course action dialog

After enrollment, the course appears in the learner's courses tab.

![Figure 19](assets/report6/image019.png)

My courses tab

Step 7: Book a learning slot

Learners select an available slot and confirm the booking.

![Figure 20](assets/report6/image020.png)

Booking action

![Figure 21](assets/report6/image021.png)

Booking schedule

![Figure 22](assets/report6/image022.png)

Booking detail

![Figure 23](assets/report6/image023.png)

Booking success

Step 8: Manage profile and other learner utilities

Learners can view and update profile information, create a new profile, redeem coupons, and use account utilities.

![Figure 24](assets/report6/image024.png)

Learner profile

![Figure 25](assets/report6/image025.png)

Edit profile

![Figure 26](assets/report6/image026.png)

Create profile

![Figure 27](assets/report6/image027.png)

Redeem coupon

![Figure 28](assets/report6/image028.png)

Learner notifications

![Figure 29](assets/report6/image029.png)

Learner streak

### 3.3 Workflow 2

Purpose

This workflow guides admin and staff users through login, dashboard review, content management, exam management, grading rubrics, user management, and course management.

Step 1: Login to admin panel

Admin users login with authorized admin, staff, or teacher accounts.

![Figure 30](assets/report6/image030.png)

Admin login

Step 2: View admin dashboard

The dashboard provides system overview information for administrators.

![Figure 31](assets/report6/image031.png)

Admin dashboard

Step 3: Manage learning content

Admin users manage vocabulary, grammar, and practice content for all four VSTEP skills.

![Figure 32](assets/report6/image032.png)

Vocabulary management

![Figure 33](assets/report6/image033.png)

Grammar management

![Figure 34](assets/report6/image034.png)

Listening management

![Figure 35](assets/report6/image035.png)

Reading management

![Figure 36](assets/report6/image036.png)

Writing management

![Figure 37](assets/report6/image037.png)

Speaking management

Content can be created and updated from management screens.

![Figure 38](assets/report6/image038.png)

Create vocabulary

![Figure 39](assets/report6/image039.png)

Update content

Step 4: Manage exams

Admin users can view, search, filter, create, import, and delete exam records.

![Figure 40](assets/report6/image040.png)

Exam management

![Figure 41](assets/report6/image041.png)

Exam search empty

![Figure 42](assets/report6/image042.png)

Exam published filter

![Figure 43](assets/report6/image043.png)

Create exam modal

![Figure 44](assets/report6/image044.png)

Import exam modal

![Figure 45](assets/report6/image045.png)

Delete exam confirmation

Step 5: Manage exam version content

Admin users manage Listening, Reading, Writing, and Speaking content inside each exam version.

![Figure 46](assets/report6/image046.png)

Exam detail listening

![Figure 47](assets/report6/image047.png)

Add listening question

![Figure 48](assets/report6/image048.png)

Exam detail reading

![Figure 49](assets/report6/image049.png)

Edit reading passage

![Figure 50](assets/report6/image050.png)

Exam detail writing

![Figure 51](assets/report6/image051.png)

Edit writing task

![Figure 52](assets/report6/image052.png)

Exam detail speaking

![Figure 53](assets/report6/image053.png)

Edit speaking part

Step 6: View grading rubrics

Admin users can view grading rubrics and inspect detailed criteria.

![Figure 54](assets/report6/image054.png)

Grading rubric list

![Figure 55](assets/report6/image055.png)

Grading rubric filter

![Figure 56](assets/report6/image056.png)

Grading rubric detail

![Figure 57](assets/report6/image057.png)

Grading criterion expanded

Step 7: Manage users

Admin users can view and manage accounts in the system.

![Figure 58](assets/report6/image058.png)

User management

Step 8: Manage courses, schedules, enrollments, slots, and bookings

Admin users can manage course records and related course operations.

![Figure 59](assets/report6/image059.png)

Course list

![Figure 60](assets/report6/image060.png)

Course search empty

![Figure 61](assets/report6/image061.png)

Course create modal

![Figure 62](assets/report6/image062.png)

Course detail info

![Figure 63](assets/report6/image063.png)

Course schedule tab

![Figure 64](assets/report6/image064.png)

Course schedule create modal

![Figure 65](assets/report6/image065.png)

Course enrollments tab

![Figure 66](assets/report6/image066.png)

Enrollment signature

![Figure 67](assets/report6/image067.png)

Course slots tab

![Figure 68](assets/report6/image068.png)

Bulk slot modal

![Figure 69](assets/report6/image069.png)

Course bookings tab

![Figure 70](assets/report6/image070.png)

Edit booking meet URL

### 3.4 Workflow 3

Purpose

This workflow guides staff users through the admin portal areas available for operational support. Staff users can review the dashboard, support learning-content maintenance, monitor exams and courses, handle leave-request information, and are restricted from unauthorized user-management actions.

Step 1: View staff dashboard

After login, staff users are redirected to the staff-accessible admin dashboard.

![Figure 71](assets/report6/image071.png)

Staff dashboard

Step 2: Support vocabulary content

Staff users can open vocabulary management to review and support vocabulary content operations.

![Figure 72](assets/report6/image072.png)

Staff vocabulary management

Step 3: Support grammar content

Staff users can open grammar management to review and support grammar content operations.

![Figure 73](assets/report6/image073.png)

Staff grammar management

Step 4: Monitor exams

Staff users can access exam management screens for operational exam review.

![Figure 74](assets/report6/image074.png)

Staff exam management

Step 5: Monitor courses

Staff users can access course management screens to support course operations.

![Figure 75](assets/report6/image075.png)

Staff course management

Step 6: Review leave requests

Staff users can review leave-request information from the admin portal.

![Figure 76](assets/report6/image076.png)

Staff leave requests

Step 7: Confirm restricted user management access

When staff users attempt to access unauthorized user-management functionality, the system redirects them away from the restricted area.

![Figure 77](assets/report6/image077.png)

Staff user management redirected

### 3.5 Workflow 4

Purpose

This workflow guides teacher users through dashboard review, schedule inspection, booking review, and leave request creation.

Step 1: Login as teacher

Teacher users login with a teacher account. The system redirects teacher users to the teacher dashboard.

![Figure 78](assets/report6/image078.png)

Teacher login

Step 2: View teacher dashboard

The teacher dashboard summarizes today's teaching slots, upcoming bookings, and pending leave requests.

![Figure 79](assets/report6/image079.png)

Teacher dashboard

Step 3: View weekly teaching schedule

Teachers can view weekly class and 1-1 teaching events.

![Figure 80](assets/report6/image080.png)

Teacher schedule all

Teachers can open a class detail modal.

![Figure 81](assets/report6/image081.png)

Teacher class detail

Teachers can filter 1-1 slots and open slot details.

![Figure 82](assets/report6/image082.png)

Teacher slot filter

![Figure 83](assets/report6/image083.png)

Teacher slot detail

Teachers can also filter classes or move to the next week.

![Figure 84](assets/report6/image084.png)

Teacher class filter

![Figure 85](assets/report6/image085.png)

Teacher next week

Step 4: View bookings

Teachers can view student bookings and meeting links.

![Figure 86](assets/report6/image086.png)

Teacher bookings

Step 5: Manage leave requests

Teachers can view leave requests and create a new request.

![Figure 87](assets/report6/image087.png)

Teacher leave requests

![Figure 88](assets/report6/image088.png)

Teacher leave create modal

The form validates required date input.

![Figure 89](assets/report6/image089.png)

Teacher leave validation

Teachers fill in the date and reason before sending the request.

![Figure 90](assets/report6/image090.png)

Teacher leave filled

### 3.6 Workflow 5

Purpose

This workflow guides learners through the mobile application experience, including app startup, authentication, dashboard review, practice modules, exams, profile utilities, and course-related screens.

Step 1: Open mobile application

Learners launch the mobile application from an Android emulator or mobile device after starting Expo.

![Figure 91](assets/report6/image091.jpg)

Mobile installation screen 1

![Figure 92](assets/report6/image092.jpg)

Mobile installation screen 2

![Figure 93](assets/report6/image093.jpg)

Mobile installation screen 3

Step 2: Login or register on mobile

Learners authenticate with an existing account or create a new account from the mobile authentication screens.

![Figure 94](assets/report6/image094.jpg)

Mobile learner auth 1

![Figure 95](assets/report6/image095.jpg)

Mobile learner auth 2

Step 3: Review mobile dashboard

After login, learners can review dashboard information, learning shortcuts, and mobile navigation entries.

![Figure 96](assets/report6/image096.jpg)

Mobile learner dashboard 1

![Figure 97](assets/report6/image097.jpg)

Mobile learner dashboard 2

![Figure 98](assets/report6/image098.jpg)

Mobile learner dashboard 3

![Figure 99](assets/report6/image099.jpg)

Mobile learner dashboard 4

![Figure 100](assets/report6/image100.jpg)

Mobile learner dashboard 5

![Figure 101](assets/report6/image101.jpg)

Mobile learner dashboard 6

Step 4: Practice learning modules on mobile

Learners can access practice modules and complete learning activities from the mobile practice area.

![Figure 102](assets/report6/image102.jpg)

Mobile learner practice 1

![Figure 103](assets/report6/image103.jpg)

Mobile learner practice 2

![Figure 104](assets/report6/image104.jpg)

Mobile learner practice 3

![Figure 105](assets/report6/image105.jpg)

Mobile learner practice 4

![Figure 106](assets/report6/image106.jpg)

Mobile learner practice 5

![Figure 107](assets/report6/image107.jpg)

Mobile learner practice 6

![Figure 108](assets/report6/image108.jpg)

Mobile learner practice 7

![Figure 109](assets/report6/image109.jpg)

Mobile learner practice 8

![Figure 110](assets/report6/image110.jpg)

Mobile learner practice 9

![Figure 111](assets/report6/image111.jpg)

Mobile learner practice 10

![Figure 112](assets/report6/image112.jpg)

Mobile learner practice 11

![Figure 113](assets/report6/image113.jpg)

Mobile learner practice 12

![Figure 114](assets/report6/image114.jpg)

Mobile learner practice 13

![Figure 115](assets/report6/image115.jpg)

Mobile learner practice 14

![Figure 116](assets/report6/image116.jpg)

Mobile learner practice 15

![Figure 117](assets/report6/image117.jpg)

Mobile learner practice 16

![Figure 118](assets/report6/image118.jpg)

Mobile learner practice 17

![Figure 119](assets/report6/image119.jpg)

Mobile learner practice 18

![Figure 120](assets/report6/image120.jpg)

Mobile learner practice 19

![Figure 121](assets/report6/image121.jpg)

Mobile learner practice 20

![Figure 122](assets/report6/image122.jpg)

Mobile learner practice 21

![Figure 123](assets/report6/image123.jpg)

Mobile learner practice 22

![Figure 124](assets/report6/image124.jpg)

Mobile learner practice 23

![Figure 125](assets/report6/image125.jpg)

Mobile learner practice 24

![Figure 126](assets/report6/image126.jpg)

Mobile learner practice 25

Step 5: Take exams on mobile

Learners can open exam screens and complete mobile exam interactions.

![Figure 127](assets/report6/image127.jpg)

Mobile learner exam 1

![Figure 128](assets/report6/image128.jpg)

Mobile learner exam 2

![Figure 129](assets/report6/image129.jpg)

Mobile learner exam 3

![Figure 130](assets/report6/image130.jpg)

Mobile learner exam 4

![Figure 131](assets/report6/image131.jpg)

Mobile learner exam 5

![Figure 132](assets/report6/image132.jpg)

Mobile learner exam 6

![Figure 133](assets/report6/image133.jpg)

Mobile learner exam 7

![Figure 134](assets/report6/image134.jpg)

Mobile learner exam 8

![Figure 135](assets/report6/image135.jpg)

Mobile learner exam 9

![Figure 136](assets/report6/image136.jpg)

Mobile learner exam 10

Step 6: Manage profile on mobile

Learners can review and update account profile information from mobile screens.

![Figure 137](assets/report6/image137.jpg)

Mobile learner profile 1

![Figure 138](assets/report6/image138.jpg)

Mobile learner profile 2

![Figure 139](assets/report6/image139.jpg)

Mobile learner profile 3

![Figure 140](assets/report6/image140.jpg)

Mobile learner profile 4

Step 7: Use course flow on mobile

Learners can browse course-related mobile screens and continue course learning activities.

![Figure 141](assets/report6/image141.jpg)

Mobile learner course flow 1

![Figure 142](assets/report6/image142.jpg)

Mobile learner course flow 2

![Figure 143](assets/report6/image143.jpg)

Mobile learner course flow 3

![Figure 144](assets/report6/image144.jpg)

Mobile learner course flow 4

![Figure 145](assets/report6/image145.jpg)

Mobile learner course flow 5
