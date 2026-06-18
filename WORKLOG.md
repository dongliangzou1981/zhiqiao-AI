# WORKLOG

## 2026-06-17 Project Handoff Baseline

### Project

* Path: `D:\Codex\Projects\Active\zhiqiao-AI`
* Branch: `codex/content-quality-revision`

### Current Clean State

* `git status --short`: clean
* `npm run typecheck`: passed
* `npm test`: passed, 78 tests passed
* `npm run test:courseware`: passed, 46 tests passed
* `npm run smoke:feedback-loop`: passed, 5 checks passed
* `git diff --check`: passed

### Recent Commits

* `cd6c400` fix: restore project control encoding
* `70b516b` chore: add project control baseline
* `759b3ad` test: add feedback loop validation tooling
* `9cfa1a9` feat: add teacher review assignments
* `2b2b59c` feat: add courseware feedback loop

### Handoff Notes

* The project has been reconnected to a file-driven GPT + Codex workflow.
* `PROJECT_CONTROL.md` is the current execution control gate.
* Codex must not continue feature development without a single explicit task from GPT.
* GPT must generate one controlled Codex task per round based on `PROJECT_CONTROL.md` and the latest Codex output.

### Current Status

* Project baseline is clean.
* Tests are passing.
* Control baseline exists.
* Worklog baseline is being added in this round.

### Next Step

Wait for GPT to generate the next single Codex task.

# 2026-06-17 Controlled Handoff Update

## Completed

* Added project control baseline.
* Restored PROJECT_CONTROL.md encoding by switching control content to English.
* Added WORKLOG.md baseline.
* Added NEXT_TASK.md task gate.
* Added feedback loop acceptance readiness preflight.
* Pushed current branch to origin/codex/content-quality-revision.

## Commits

* be50ee3 test: add feedback loop acceptance readiness preflight
* 7fa6978 chore: add next task gate
* 4875595 chore: add project worklog baseline
* cd6c400 fix: restore project control encoding
* 70b516b chore: add project control baseline

## Current Baseline

* git status --short: clean
* npm run typecheck: passed
* npm test: passed, 81 tests passed
* npm run test:courseware: passed, 46 tests passed
* npm run smoke:feedback-loop: passed with 5 passed, 0 failed, 0 skipped, 1 blocked
* git diff --check: passed

## Known Blocked Item

* Browser acceptance is blocked because local real-account configuration is missing.
* Missing FEEDBACK_LOOP_* config prevents npm run acceptance:feedback-loop from proving the full real browser workflow.
* This is not a smoke failure.

## Next Recommended Step

Wait for GPT to choose the next single controlled task.

# 2026-06-17 Student Login Code Foundation

## Completed

* Added student login code data model draft.
* Added pure helper functions for generating, normalizing, hashing, verifying, and checking student login code readiness.
* Added unit tests for the student login code helper.
* Hardened login code hashing from plain SHA-256 to HMAC-SHA256.
* Required server-side secret for hashing and verification.
* Minimized SQL grants so client-facing select does not expose code_hash.
* Pushed current branch to origin/codex/content-quality-revision.

## Commits

* 80d3a8f fix: harden student login code foundation
* 8ad033d feat: add student login code foundation

## Current Baseline

* git status --short: clean
* npm run typecheck: passed
* npm test: passed, 91 tests passed
* git diff --check: passed
* Remote branch updated to 80d3a8f

## Known Remaining Work

* Real student login by code is not implemented yet.
* No student login page exists yet.
* No login code exchange API exists yet.
* No Supabase Auth session creation or restoration flow exists yet.
* Browser acceptance still needs to be adjusted away from student email/password.

## Next Recommended Step

Wait for GPT to choose the next single controlled task.
