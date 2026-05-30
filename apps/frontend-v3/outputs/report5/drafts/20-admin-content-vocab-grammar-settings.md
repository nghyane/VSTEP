# 20. Admin Content: Vocab, Grammar, Settings Test Cases (17 cases — đã lọc)

**Module:** Admin vocabulary management, grammar management, system configuration  
**Source:** `apps/backend-v2` Admin VocabController, GrammarController, SystemConfigController; `apps/admin` vocab, grammar, settings routes  
**Backend tests:** `Admin/Vocab/*Test.php`, `Admin/Grammar/*Test.php`

## Vocabulary Management

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-VOC-001 | List vocabulary topics | Admin authenticated, topics exist | GET `admin/vocab/topics` | 200, topic list with status, word count | High |
| ADM-VOC-002 | Create vocabulary topic | Admin authenticated | POST `admin/vocab/topics` with title/level/order | 201, topic created as draft | High |
| ADM-VOC-004 | Publish vocabulary topic | Draft topic with words + exercises | POST `admin/vocab/topics/{id}/publish` | 200, topic published, visible to learners | Critical |
| ADM-VOC-005 | Unpublish vocabulary topic | Published topic | POST `admin/vocab/topics/{id}/unpublish` | 200, topic hidden from learners | High |
| ADM-VOC-015 | Frontend admin vocab topic page | Admin logged in | Open vocab section | Topic list, create/edit form, publish toggles, word and exercise tabs | High |

## Grammar Management

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-GRAM-001 | List grammar points | Admin authenticated, points exist | GET `admin/grammar/points` | 200, point list with publish status | High |
| ADM-GRAM-002 | Create grammar point | Admin authenticated | POST `admin/grammar/points` | 201, point created as draft | High |
| ADM-GRAM-004 | Publish grammar point | Draft point with content | POST `admin/grammar/points/{id}/publish` | 200, point published | Critical |
| ADM-GRAM-005 | Unpublish grammar point | Published point | POST `admin/grammar/points/{id}/unpublish` | 200, point hidden | High |
| ADM-GRAM-012 | Frontend admin grammar point form | Admin logged in | Open grammar point detail | Structures, examples, mistakes, tips, exercises tabs with CRUD forms | High |

## System Configuration

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| ADM-CONFIG-001 | List system config | Admin authenticated | GET `admin/system-config` | 200, config key-value list | High |
| ADM-CONFIG-003 | Update system config | Admin authenticated, valid value | PATCH `admin/system-config/{key}` with valid value | 200, value updated | High |
| ADM-CONFIG-004 | System config admin-only (not staff) | Staff user (not admin) | GET `admin/system-config` | 403 | Critical |
