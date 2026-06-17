# PROJECT_CONTROL

## 1. Project Path

D:\Codex\Projects\Active\zhiqiao-AI

## 2. Current Branch

codex/content-quality-revision

## 3. Baseline Status

* `git status --short`: clean
* `npm run typecheck`: passed
* `npm test`: passed, 78 tests passed
* `npm run test:courseware`: passed, 46 tests passed
* `npm run smoke:feedback-loop`: passed, 5 checks passed
* `git diff --check`: passed

## 4. Recent Commits

* `70b516b` chore: add project control baseline
* `759b3ad` test: add feedback loop validation tooling
* `9cfa1a9` feat: add teacher review assignments
* `2b2b59c` feat: add courseware feedback loop
* `75a66a1` feat: add k12 external import staging
* `796bbc9` feat: add k12 knowledge base foundation

## 5. Codex Execution Rules

* Every round must start with `git status --short`.
* Do not overwrite existing uncommitted changes.
* Each round must have exactly one clear task.
* Do not make unrelated optimizations.
* Do not perform large refactors.
* Do not modify unrelated files.
* Do not change database schema unless the task explicitly requires it.
* Do not change routing structure unless the task explicitly requires it.
* If a test fails, stop and report the failure.
* Only commit after the required checks pass.

## 6. GPT Usage Rules

* GPT must generate Codex instructions based on this file and the latest Codex output.
* GPT must not redesign the whole project.
* GPT must not expand the task scope.
* GPT must not override existing completed commits.
* GPT should produce one clear Codex task per round.

## 7. Current Next Step

Wait for GPT to generate the next single Codex task based on the current project state.

Codex must not continue feature development on its own.

## 8. Required Output Format After Each Codex Round

Codex must report:

1. Current `git status --short`
2. Files changed
3. Reason for each changed file
4. Commands run
5. Test results
6. Commit hash, if committed
7. Remaining issues
8. Suggested next task
