# NEXT_TASK

## Current Single Task

Wait for GPT to generate the next controlled Codex task.

Codex must not start feature development without one explicit task from GPT.

## Candidate Tasks

These are candidate tasks only. Do not execute them until GPT selects one as the current single task.

1. Review the current feature chain and identify the next safest implementation step.
2. Check whether the teacher review and feedback loop pages need UI or data consistency fixes.
3. Check whether the K12 knowledge base import flow needs validation or documentation.
4. Check whether current smoke tests need coverage expansion.

## Deferred Tasks

Do not handle these without explicit GPT instruction:

* Large refactors
* Database schema changes
* Routing structure changes
* New product directions
* Broad UI redesigns
* Unrelated cleanup
* Dependency upgrades

## Round Rules

Before executing any future task, Codex must:

1. Read `PROJECT_CONTROL.md`.
2. Read `WORKLOG.md`.
3. Read `NEXT_TASK.md`.
4. Run `git status --short`.
5. Execute only the task marked as `Current Single Task`.
6. Stop if there are unexpected uncommitted changes.
7. Report all changed files, commands, test results, and commit hash.
