# 26. Non-functional Test Cases (14 cases — đã lọc)

**Module:** Security, Performance, Compatibility, Usability, Reliability  
**Source:** `apps/backend-v2`, `apps/frontend-v3`, `apps/admin`

## Security

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| NFT-SEC-001 | Expired token rejected on all protected endpoints | Expired access token | Call protected endpoint | 401 Unauthorized | Critical |
| NFT-SEC-003 | Learner cannot access admin/staff API | Learner token | Call `admin/*` endpoints | 403 | Critical |
| NFT-SEC-005 | User cannot access other user's profile | Learner token for user A | PATCH `profiles/{userB_profile_id}` | 403 or 404 | Critical |
| NFT-SEC-007 | Password not exposed in API responses | Login response | Inspect response body | No password hash or raw password returned | Critical |
| NFT-SEC-011 | XSS prevented | Writing/submission endpoints | Input script tags in writing answer | Script tags not rendered as HTML in result | High |

## Performance

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| NFT-PERF-001 | AI grading response/job accepted within 3 seconds | Writing/speaking submission | Submit and measure time to grading job creation | Job created within 3 seconds of submission request | Critical |
| NFT-PERF-002 | API responses under 2 seconds for common endpoints | Backend running, cached config | Request exams, profile, dashboard endpoints | Response time under 2 seconds | High |

## Compatibility & Usability

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| NFT-COMP-001 | Learner web works on Chrome latest | Chrome browser | Open login, register, dashboard, exam room | All pages render, forms work | High |
| NFT-USE-003 | Exam room exit confirmation protects accidental exit | Active exam | Click exit during exam | Confirmation dialog with countdown before exiting | High |
| NFT-USE-005 | Empty states are informative | Empty list pages | Open empty vocab, grammar, submitted exams | Informative message and CTA visible | Medium |

## Reliability

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| NFT-REL-001 | Data consistency after exam submit | Submit exam | Refresh page, check result via API | Same score and details returned consistently | High |
| NFT-REL-002 | Draft save survives page crash simulation | Active exam with answers | Close tab during exam, reopen | Draft restored from last autosave | Critical |
