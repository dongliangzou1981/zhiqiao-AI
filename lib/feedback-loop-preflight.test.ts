import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFeedbackLoopPreflightChecks,
  formatFeedbackLoopPreflightSummary,
} from "./feedback-loop-preflight";

const browserAcceptanceEnv = {
  FEEDBACK_LOOP_TEACHER_EMAIL: "teacher@example.com",
  FEEDBACK_LOOP_TEACHER_PASSWORD: "teacher-secret",
  FEEDBACK_LOOP_STUDENT_EMAIL: "student@example.com",
  FEEDBACK_LOOP_STUDENT_PASSWORD: "student-secret",
  FEEDBACK_LOOP_COURSEWARE_ID: "courseware-123",
  FEEDBACK_LOOP_KNOWLEDGE_POINT_CODE: "J-MATH-RJ-71-05-03",
};

test("buildFeedbackLoopPreflightChecks passes when required docs, env, routes and tables are available", () => {
  const checks = buildFeedbackLoopPreflightChecks({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
      ...browserAcceptanceEnv,
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

test("buildFeedbackLoopPreflightChecks reports browser acceptance readiness when config is available", () => {
  const checks = buildFeedbackLoopPreflightChecks({
    env: browserAcceptanceEnv,
    docs: {
      acceptanceChecklist: true,
      teacherTrialGuide: true,
    },
  });

  const readiness = checks.find(
    (check) => check.name === "Browser acceptance readiness"
  );
  assert.equal(readiness?.status, "pass");
  assert.match(readiness?.detail ?? "", /ready: 7 browser acceptance steps/);
});

test("buildFeedbackLoopPreflightChecks blocks browser acceptance readiness without failing smoke", () => {
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

  const readiness = checks.find(
    (check) => check.name === "Browser acceptance readiness"
  );
  assert.equal(readiness?.status, "blocked");
  assert.match(
    readiness?.detail ?? "",
    /FEEDBACK_LOOP_TEACHER_EMAIL/
  );
  assert.equal(checks.some((check) => check.status === "fail"), false);
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

test("formatFeedbackLoopPreflightSummary includes blocked readiness checks", () => {
  const summary = formatFeedbackLoopPreflightSummary([
    { name: "A", status: "pass", detail: "ok" },
    { name: "B", status: "blocked", detail: "missing browser config" },
  ]);

  assert.equal(summary, "1 passed, 0 failed, 0 skipped, 1 blocked");
});
