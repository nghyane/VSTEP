# Report 5 Decision Summary

## Final Scope Recommendation

Report 5 should focus on `apps/frontend-v3` learner-facing flows only:

- Learner authentication and onboarding.
- Exam library, exam detail, and exam room.
- Wallet balance, top-up, coin charging, and promo-code redemption.
- Result summary and result detail after exam submission.

This scope is stronger than a broad whole-system report because it can be traced directly to frontend source files and testable learner behavior.

## Why Not Use the Previous 44-Module Excel

The previous Excel was project-wide and included admin/teacher modules. Those modules are real, but they do not match the focused Report 5 scope above. For a high-quality report, test cases must be specific, traceable, and not generic.

## Quality Standard

Harvard does not define a specific software-test-case template. For academic rigor, this report should follow an IEEE/ISO-style structure:

- Requirement or behavior under test.
- Preconditions.
- Concrete test steps.
- Test data.
- Expected result.
- Priority/severity.
- Execution rounds and tester in Excel.
- Traceability to source files.

## Files to Produce After Approval

- `Report5_VSTEP_FrontendV3_Test_Documentation.docx`
- `Report5_VSTEP_FrontendV3_Test_Report.xlsx`

## Execution Status Policy

Use `Pending` for cases not executed yet. Change to `Passed`, `Failed`, or `N/A` only after running the test on local/staging environment.
