# 14. Learner Practice Speaking Test Cases (14 cases — đã lọc)

**Module:** Speaking drills, VSTEP speaking tasks, conversation AI, shadowing  
**Source:** `apps/backend-v2` SpeakingPracticeController, SpeakingConversationController, ShadowingProgressController; `apps/frontend-v3` speaking routes/features  
**Backend tests:** `Practice/SpeakingPracticeTest.php`, `Practice/ConversationPracticeTest.php`, `Unit/Conversation/SpeakingConversationServiceTest.php`

## Speaking Drills (Pronunciation)

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| SPK-DRL-004 | Record drill attempt with audio | Active drill session | POST `practice/speaking/drill-sessions/{id}/attempt` with audio file | 200, attempt recorded, pronunciation/fluency feedback | Critical |
| SPK-DRL-006 | Frontend speaking drill list with filters | Drills with different levels | Open speaking practice, drills tab | Drills displayed, level filters, practice history link | High |

## VSTEP Speaking Tasks

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| SPK-VST-004 | Submit VSTEP speaking session | Active session | POST `practice/speaking/vstep-sessions/{id}/submit` with audio answers | 200, submission accepted, grading job triggered | Critical |
| SPK-VST-006 | Frontend VSTEP speaking task practice | Task exists in web app | Select task, record per part, submit | Submit confirmation, waiting for grading | High |

## Conversation AI

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| SPK-CONV-003 | Start conversation session | Scenario exists, authenticated | POST `practice/speaking/conversations` | 201, conversation session with first AI turn | Critical |
| SPK-CONV-004 | Send conversation turn | Active conversation | POST `practice/speaking/conversations/{id}/turn` with audio + text | 200, AI responds with next turn | Critical |
| SPK-CONV-006 | Conversation review with feedback | Ended conversation | GET `practice/speaking/conversations/{id}/review` | 200, review with content relevance, task fulfillment, pronunciation, feedback per turn | High |
| SPK-CONV-008 | Frontend conversation flow | Scenario selected | Start scenario, speak/respond, end conversation | Turn-by-turn UI, review popup with feedback | High |

## Shadowing

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| SPK-SHA-003 | Frontend shadowing session | Lesson exists | Open shadowing lesson, play audio, record, compare | Segment-by-segment flow, pronunciation feedback | High |
