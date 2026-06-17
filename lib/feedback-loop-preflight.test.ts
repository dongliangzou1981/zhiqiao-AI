import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFeedbackLoopPreflightChecks,
  formatFeedbackLoopPreflightSummary,
} from "./feedback-loop-preflight";

test("buildFeedbackLoopPreflightChecks passes when required docs, env, routes and tables are available", () => {
  const checks = buildFeedbackLoopPreflightChecks({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    },
    docs: {
      acceptanceChecklist: true,
      teacherTrialGuide: true,
    },
    http: {
      loginStatus: 200,
      analyticsStatus: 307,
    },
    supabase: {
      coursewareRevisions: true,
      studentCoursewareFeedback: true,
      teacherReviewTasks: true,
    },
  });

  assert.equal(checks.every((check) => check.status === "pass"), true);
});

test("buildFeedbackLoopPreflightChecks skips remote table checks when service env is missing", () => {
  const checks = buildFeedbackLoopPreflightChecks({
    env: {},
    docs: {
      acceptanceChecklist: true,
      teacherTrialGuide: true,
    },
    http: {
      loginStatus: 200,
      analyticsStatus: 307,
    },
  });

  assert.equal(
    checks.find((check) => check.name === "Supabase remote tables")?.status,
    "skip"
  );
  assert.equal(
    checks.find((check) => check.name === "Supabase environment")?.status,
    "fail"
  );
});

test("buildFeedbackLoopPreflightChecks fails unexpected route statuses", () => {
  const checks = buildFeedbackLoopPreflightChecks({
    env: {},
    docs: {
      acceptanceChecklist: true,
      teacherTrialGuide: true,
    },
    http: {
      loginStatus: 500,
      analyticsStatus: 500,
    },
  });

  assert.equal(checks.find((check) => check.name === "Login route")?.status, "fail");
  assert.equal(checks.find((check) => check.name === "Teacher analytics route")?.status, "fail");
});

test("formatFeedbackLoopPreflightSummary counts pass, fail and skipped checks", () => {
  const summary = formatFeedbackLoopPreflightSummary([
    { name: "A", status: "pass", detail: "ok" },
    { name: "B", status: "fail", detail: "bad" },
    { name: "C", status: "skip", detail: "missing env" },
  ]);

  assert.equal(summary, "1 passed, 1 failed, 1 skipped");
});
