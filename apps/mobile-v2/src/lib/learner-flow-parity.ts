export type LearnerFlowStatus = "done" | "partial" | "missing"

export interface LearnerFlowParityItem {
  area: string
  flow: string
  frontendV3: string[]
  mobileV2: string[]
  backendApi: string[]
  status: LearnerFlowStatus
  gaps: string[]
  nextPhase: number
}

export const learnerFlowParity: LearnerFlowParityItem[] = [
  // ── Auth (Phase 1 — DONE) ──
  {
    area: "Auth",
    flow: "Launch restore session, refresh token, route guard",
    frontendV3: ["src/lib/auth.ts", "src/routes/_app.tsx"],
    mobileV2: ["app/_layout.tsx", "src/lib/auth.ts", "src/lib/api.ts", "src/hooks/use-auth.ts"],
    backendApi: ["POST /api/v1/auth/refresh", "GET /api/v1/auth/me"],
    status: "done",
    gaps: [],
    nextPhase: 1,
  },
  {
    area: "Auth",
    flow: "Login/register and complete onboarding",
    frontendV3: ["src/lib/auth.ts", "src/features/auth", "src/features/onboarding"],
    mobileV2: ["app/(auth)/login.tsx", "app/(auth)/register.tsx", "app/(app)/onboarding.tsx"],
    backendApi: [
      "POST /api/v1/auth/login",
      "POST /api/v1/auth/register",
      "POST /api/v1/auth/complete-onboarding",
    ],
    status: "done",
    gaps: [],
    nextPhase: 1,
  },

  // ── Dashboard (Phase 10) ──
  {
    area: "Dashboard",
    flow: "Overview, stats, next action, spider chart",
    frontendV3: [
      "src/routes/_app/dashboard.tsx",
      "src/features/dashboard/queries.ts",
      "src/features/dashboard/components",
    ],
    mobileV2: ["app/(app)/(tabs)/index.tsx", "src/hooks/use-progress.ts"],
    backendApi: ["GET /api/v1/overview", "GET /api/v1/streak", "GET /api/v1/activity-heatmap"],
    status: "partial",
    gaps: [
      "Activity heatmap is queried by hook but not rendered on dashboard.",
      "GapAnalysis from frontend-v3 is missing.",
      "ScoreTrend exists in frontend-v3 (commit 490b35f) but not ported to mobile.",
      "Next action weakest-skill logic is simpler than frontend-v3 target-band gap logic.",
    ],
    nextPhase: 10,
  },

  // ── Foundation — Vocabulary (Phase 4) ──
  {
    area: "Foundation",
    flow: "Vocabulary index, topic detail, flashcard, exercise, SRS review",
    frontendV3: [
      "src/routes/_app/luyen-tap/tu-vung/index.tsx",
      "src/routes/_app/luyen-tap/tu-vung/$topicId.tsx",
      "src/routes/_focused/vocab/$topicId/flashcard.tsx",
      "src/routes/_focused/vocab/$topicId/exercise.tsx",
      "src/routes/_focused/vocab/srs-review.tsx",
      "src/features/vocab",
    ],
    mobileV2: [
      "app/(app)/vocabulary/index.tsx",
      "app/(app)/vocabulary/[id].tsx",
      "app/(app)/vocabulary/[id]/flashcard.tsx",
      "app/(app)/vocabulary/[id]/exercise.tsx",
      "app/(app)/vocabulary/srs-review.tsx",
      "src/hooks/use-vocab.ts",
    ],
    backendApi: [
      "GET /api/v1/vocab/topics",
      "GET /api/v1/vocab/topics/{id}",
      "GET /api/v1/vocab/srs/queue",
      "POST /api/v1/vocab/srs/review",
      "POST /api/v1/vocab/exercises/{id}/attempt",
    ],
    status: "done",
    gaps: [],
    nextPhase: 4,
  },

  // ── Foundation — Grammar (Phase 4) ──
  {
    area: "Foundation",
    flow: "Grammar list, point detail, exercise attempt",
    frontendV3: [
      "src/routes/_app/luyen-tap/ngu-phap/index.tsx",
      "src/routes/_app/luyen-tap/ngu-phap/$pointId.tsx",
      "src/routes/_focused/grammar/$pointId/exercise.tsx",
      "src/features/grammar",
    ],
    mobileV2: [
      "app/(app)/practice/grammar/index.tsx",
      "app/(app)/practice/grammar/[pointId].tsx",
      "app/(app)/practice/grammar/[pointId]/exercise.tsx",
      "src/hooks/use-grammar.ts",
    ],
    backendApi: [
      "GET /api/v1/grammar/points",
      "GET /api/v1/grammar/points/{id}",
      "POST /api/v1/grammar/exercises/{id}/attempt",
    ],
    status: "done",
    gaps: [],
    nextPhase: 4,
  },

  // ── Practice — Listening (Phase 3 — DONE) ──
  {
    area: "Practice",
    flow: "Listening objective practice",
    frontendV3: [
      "src/routes/_app/luyen-tap/nghe/index.tsx",
      "src/routes/_focused/listening/$exerciseId.tsx",
      "src/features/practice/components/ListeningPreview.tsx",
      "src/features/practice/components/ListeningInProgress.tsx",
      "src/features/practice/use-listening-session.ts",
    ],
    mobileV2: [
      "app/(app)/practice/listening/index.tsx",
      "app/(app)/practice/listening/[exerciseId].tsx",
      "src/hooks/use-practice.ts",
    ],
    backendApi: [
      "GET /api/v1/practice/listening/exercises",
      "GET /api/v1/practice/listening/exercises/{id}",
      "POST /api/v1/practice/listening/sessions",
      "POST /api/v1/practice/listening/sessions/{sessionId}/submit",
      "POST /api/v1/practice/listening/sessions/{sessionId}/support",
      "GET /api/v1/practice/listening/progress",
    ],
    status: "done",
    gaps: [],
    nextPhase: 3,
  },

  // ── Practice — Reading (Phase 3 — DONE) ──
  {
    area: "Practice",
    flow: "Reading objective practice",
    frontendV3: [
      "src/routes/_app/luyen-tap/doc.tsx",
      "src/routes/_focused/reading/$exerciseId.tsx",
      "src/features/practice/components/ReadingPreview.tsx",
      "src/features/practice/components/ReadingInProgress.tsx",
      "src/features/practice/use-mcq-session.ts",
    ],
    mobileV2: [
      "app/(app)/practice/reading/index.tsx",
      "app/(app)/practice/reading/[exerciseId].tsx",
      "src/hooks/use-practice.ts",
    ],
    backendApi: [
      "GET /api/v1/practice/reading/exercises",
      "GET /api/v1/practice/reading/exercises/{id}",
      "POST /api/v1/practice/reading/sessions",
      "POST /api/v1/practice/reading/sessions/{sessionId}/submit",
      "POST /api/v1/practice/reading/sessions/{sessionId}/support",
      "GET /api/v1/practice/reading/progress",
    ],
    status: "done",
    gaps: [],
    nextPhase: 3,
  },

  // ── Practice — Writing (Phase 5) ──
  {
    area: "Practice",
    flow: "Writing subjective practice with async grading",
    frontendV3: [
      "src/routes/_app/luyen-tap/viet.tsx",
      "src/routes/_focused/writing/$promptId.tsx",
      "src/routes/_focused/grading/writing.$submissionId.tsx",
      "src/features/practice/components/WritingPreview.tsx",
      "src/features/practice/components/WritingInProgress.tsx",
      "src/features/grading/components/WritingResult.tsx",
    ],
    mobileV2: [
      "app/(app)/practice/writing/index.tsx",
      "app/(app)/practice/writing/[promptId].tsx",
      "app/(app)/grading/writing/[submissionId].tsx",
      "src/hooks/use-practice.ts",
    ],
    backendApi: [
      "GET /api/v1/practice/writing/prompts",
      "GET /api/v1/practice/writing/prompts/{id}",
      "GET /api/v1/practice/writing/history",
      "POST /api/v1/practice/writing/sessions",
      "POST /api/v1/practice/writing/sessions/{sessionId}/support",
      "POST /api/v1/practice/writing/sessions/{sessionId}/submit",
      "GET /api/v1/grading/writing/practice_writing/{submissionId}",
    ],
    status: "done",
    gaps: ["TranslateSelection popup (commit 490b35f) — not in mobile yet."],
    nextPhase: 5,
  },

  // ── Practice — Speaking Drill (Phase 6) ──
  {
    area: "Practice",
    flow: "Speaking drill practice",
    frontendV3: [
      "src/routes/_app/luyen-tap/noi.tsx",
      "src/routes/_focused/speaking/drill/$drillId.tsx",
      "src/features/practice/components/SpeakingDrillPreview.tsx",
      "src/features/practice/components/SpeakingDrillInProgress.tsx",
    ],
    mobileV2: [
      "app/(app)/practice/speaking/drills.tsx",
      "app/(app)/practice/speaking/drill/[drillId].tsx",
      "app/(app)/practice/speaking/history.tsx",
      "src/hooks/use-practice.ts",
    ],
    backendApi: [
      "GET /api/v1/practice/speaking/drills",
      "GET /api/v1/practice/speaking/drills/{id}",
      "GET /api/v1/practice/speaking/drill-history",
      "POST /api/v1/practice/speaking/drill-sessions",
      "POST /api/v1/practice/speaking/drill-sessions/{sessionId}/attempt",
    ],
    status: "done",
    gaps: [],
    nextPhase: 6,
  },

  // ── Practice — Speaking VSTEP (Phase 6) ──
  {
    area: "Practice",
    flow: "Speaking VSTEP practice with audio upload and async grading",
    frontendV3: [
      "src/routes/_focused/speaking/task/$taskId.tsx",
      "src/routes/_focused/grading/speaking.$submissionId.tsx",
      "src/features/practice/components/VstepSpeakingPreview.tsx",
      "src/features/practice/components/VstepSpeakingInProgress.tsx",
      "src/features/practice/use-voice-recorder.ts",
      "src/features/grading/components/SpeakingResult.tsx",
    ],
    mobileV2: [
      "app/(app)/practice/speaking/index.tsx",
      "app/(app)/practice/speaking/[taskId].tsx",
      "app/(app)/grading/speaking/[submissionId].tsx",
      "src/hooks/use-practice.ts",
    ],
    backendApi: [
      "GET /api/v1/practice/speaking/tasks",
      "GET /api/v1/practice/speaking/tasks/{id}",
      "GET /api/v1/practice/speaking/vstep-history",
      "POST /api/v1/audio/presign-upload",
      "POST /api/v1/practice/speaking/vstep-sessions",
      "POST /api/v1/practice/speaking/vstep-sessions/{sessionId}/submit",
      "GET /api/v1/grading/speaking/practice_speaking/{submissionId}",
    ],
    status: "done",
    gaps: [
      "TranslateSelection popup added in frontend-v3 — not in mobile.",
    ],
    nextPhase: 6,
  },

  // ── Exam — List/Detail (Phase 7) ──
  {
    area: "Exam",
    flow: "Exam list and detail",
    frontendV3: ["src/routes/_app/thi-thu/index.tsx", "src/routes/_app/thi-thu/$examId.tsx", "src/features/exam"],
    mobileV2: ["app/(app)/(tabs)/exams.tsx", "app/(app)/exam/[id].tsx", "src/hooks/use-exams.ts"],
    backendApi: ["GET /api/v1/exams", "GET /api/v1/exams/{id}", "GET /api/v1/config"],
    status: "done",
    gaps: [],
    nextPhase: 7,
  },

  // ── Exam — Room/Submit/Result (Phase 7 + 8) ──
  {
    area: "Exam",
    flow: "Exam room, timer, answers, submit, result",
    frontendV3: [
      "src/routes/_focused/phong-thi/$sessionId.tsx",
      "src/features/exam/use-exam-session.ts",
      "src/features/exam/components/ListeningPanel.tsx",
      "src/features/exam/components/ReadingPanel.tsx",
      "src/features/exam/components/WritingPanel.tsx",
      "src/features/exam/components/SpeakingPanel.tsx",
      "src/features/exam/components/DeviceTestWidgets.tsx",
    ],
    mobileV2: ["app/(app)/session/[id].tsx", "app/(app)/exam-result/[id].tsx", "src/hooks/use-exam-session.ts"],
    backendApi: [
      "POST /api/v1/exams/{examId}/sessions",
      "GET /api/v1/exam-sessions/{sessionId}",
      "GET /api/v1/exam-sessions/active",
      "POST /api/v1/exam-sessions/{sessionId}/submit",
      "POST /api/v1/exam-sessions/{sessionId}/listening-played",
      "GET /api/v1/exam-sessions/{sessionId}/results",
      "GET /api/v1/exam-sessions/{sessionId}/writing-results",
      "GET /api/v1/exam-sessions/{sessionId}/speaking-results",
    ],
    status: "done",
    gaps: [],
    nextPhase: 8,
  },

  // ── Profile (Phase 9) ──
  {
    area: "Profile",
    flow: "Profiles, active profile, create/edit/switch, account info",
    frontendV3: ["src/routes/_app/ho-so.tsx", "src/features/profile"],
    mobileV2: ["app/(app)/(tabs)/profile.tsx", "app/(app)/goal.tsx", "app/(app)/account.tsx"],
    backendApi: [
      "GET /api/v1/profiles",
      "POST /api/v1/profiles",
      "PATCH /api/v1/profiles/{id}",
      "DELETE /api/v1/profiles/{id}",
      "POST /api/v1/auth/switch-profile",
    ],
    status: "partial",
    gaps: [
      "Goal screen is local UI only and contains remaining Vietnamese text without accents.",
      "Create/edit/switch profile parity with frontend-v3 is missing.",
      "Account screen contains remaining Vietnamese text without accents and is minimal.",
    ],
    nextPhase: 9,
  },

  // ── Notifications (Phase 11) ──
  {
    area: "Notifications",
    flow: "Unread count, notification list, read all, delete",
    frontendV3: ["src/features/notifications"],
    mobileV2: ["src/features/notification", "app/(app)/(tabs)/notifications.tsx"],
    backendApi: [
      "GET /api/v1/notifications",
      "GET /api/v1/notifications/unread-count",
      "POST /api/v1/notifications/read-all",
      "DELETE /api/v1/notifications/{id}",
    ],
    status: "partial",
    gaps: ["Mobile notification tab redirects to dashboard; only button/store shell exists."],
    nextPhase: 11,
  },

  // ── Wallet (Phase 11) ──
  {
    area: "Wallet",
    flow: "Balance, transactions, top up, promo redeem",
    frontendV3: ["src/features/wallet"],
    mobileV2: ["src/features/coin"],
    backendApi: [
      "GET /api/v1/wallet/balance",
      "GET /api/v1/wallet/transactions",
      "GET /api/v1/wallet/topup-packages",
      "POST /api/v1/wallet/topup",
      "POST /api/v1/wallet/topup/{orderId}/confirm",
      "POST /api/v1/wallet/promo-redeem",
    ],
    status: "missing",
    gaps: [
      "Mobile coin feature is local/store-oriented and does not mirror backend wallet flow.",
      "Welcome gift + top-up dialog polished in frontend-v3 (commit e4ab064) — not in mobile.",
    ],
    nextPhase: 11,
  },

  // ── Courses (Phase 11) ──
  {
    area: "Courses",
    flow: "Course list, detail, enrollment, booking",
    frontendV3: ["src/routes/_app/khoa-hoc", "src/features/course"],
    mobileV2: ["app/(app)/(tabs)/classes.tsx"],
    backendApi: [
      "GET /api/v1/courses",
      "GET /api/v1/courses/{id}",
      "POST /api/v1/courses/{id}/enrollment-orders",
      "GET /api/v1/courses/enrollment-orders",
      "POST /api/v1/courses/enrollment-orders/{orderId}/confirm",
      "POST /api/v1/courses/{courseId}/bookings",
    ],
    status: "missing",
    gaps: ["Classes tab redirects to dashboard; course learner flow is not implemented."],
    nextPhase: 11,
  },
]

export function getLearnerFlowParityByPhase(phase: number): LearnerFlowParityItem[] {
  return learnerFlowParity.filter((item) => item.nextPhase === phase)
}

export function getIncompleteLearnerFlowParity(): LearnerFlowParityItem[] {
  return learnerFlowParity.filter((item) => item.status !== "done")
}
