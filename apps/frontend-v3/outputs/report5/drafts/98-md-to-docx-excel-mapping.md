# Mapping: MD test case → Report 5 DOCX/Excel

## Kiểm tra so với template mẫu

### Excel template columns (row 10)

| Column | Template Field | Từ MD file |
|---|---|---|
| A | Test Case ID | ✅ `ID` |
| B | Test Case Description | ✅ `Case` |
| C | Test Case Procedure | ✅ `Steps` |
| D | Expected Results | ✅ `Expected` |
| E | Pre-conditions | ✅ `Precondition` |
| F | Round 1 | ⚙️ Pending |
| G | Test date | ⚙️ TBD |
| H | Tester | ⚙️ Team member |
| I | Round 2 | ⚙️ Pending |
| J | Test date | ⚙️ TBD |
| K | Tester | ⚙️ Team member |
| L | Round 3 | ⚙️ Pending |
| M | Test date | ⚙️ TBD |
| N | Tester | ⚙️ Team member |
| O | Note | ⚙️ Priority + evidence path |

✅ = có sẵn trong MD  
⚙️ = điền tự động khi tạo Excel (Pending / team / dates)

### Excel metadata rows (1-8)

| Row | Required | Có thể tạo từ |
|---|---|---|
| 2 Feature | ✅ | Module name trong MD |
| 3 Test requirement | ✅ | Description trong MD |
| 4 Number of TCs | ✅ | COUNT formula tự động |
| 5-8 Round stats | ✅ | COUNTIF formula tự động |

### DOCX tables

| Table | Columns | Dữ liệu lấy từ MD |
|---|---|---|
| Record of Changes | Date, A/M/D, In charge, Change desc | ✅ `00-`, ngày/thành viên |
| Scope (Feature list) | Feature, Function, Role, Description | ✅ Mỗi module MD |
| Test Types | Type, Objective, Technique, Criteria | ✅ `02-test-strategy.md` |
| Test Levels | Type, Unit, Integration, System, Acceptance | ✅ `02-test-strategy.md` |
| Supporting Tools | Purpose, Tool, Vendor, Version | ✅ `02-test-strategy.md` |
| Human Resources | Worker, Role, Responsibilities | ✅ `03-test-plan.md` |
| Test Environment | Purpose, Tool, Provider, Version | ✅ `03-test-plan.md` |
| Test Milestones | Task, Start, End | ✅ `03-test-plan.md` |

## Kết luận

**Tất cả MD file có thể dùng để tạo DOCX + Excel.**  
Không thiếu trường nào so với mẫu.  
Các cột execution (Round 1/2/3, date, tester) chưa có vì chưa chạy test thật → để Pending.
