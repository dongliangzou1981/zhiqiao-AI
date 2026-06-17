import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFeedbackLoopBrowserAcceptancePlan,
  formatFeedbackLoopBrowserAcceptanceSummary,
} from "./feedback-loop-browser-acceptance";

test("buildFeedbackLoopBrowserAcceptancePlan blocks when real-account config is missing", () => {
  const plan = buildFeedbackLoopBrowserAcceptancePlan({ env: {} });

  assert.equal(plan.status, "blocked");
  assert.deepEqual(plan.missingConfig, [
    "FEEDBACK_LOOP_TEACHER_EMAIL",
    "FEEDBACK_LOOP_TEACHER_PASSWORD",
    "FEEDBACK_LOOP_STUDENT_EMAIL",
    "FEEDBACK_LOOP_STUDENT_PASSWORD",
    "FEEDBACK_LOOP_COURSEWARE_ID",
    "FEEDBACK_LOOP_KNOWLEDGE_POINT_CODE",
  ]);
  assert.equal(plan.steps.length, 0);
  assert.match(plan.blocker ?? "", /真实账号/);
});

test("buildFeedbackLoopBrowserAcceptancePlan builds ordered steps without exposing passwords", () => {
  const plan = buildFeedbackLoopBrowserAcceptancePlan({
    env: {
      FEEDBACK_LOOP_APP_URL: "http://localhost:4000",
      FEEDBACK_LOOP_TEACHER_EMAIL: "teacher@example.com",
      FEEDBACK_LOOP_TEACHER_PASSWORD: "teacher-secret",
      FEEDBACK_LOOP_STUDENT_EMAIL: "student@example.com",
      FEEDBACK_LOOP_STUDENT_PASSWORD: "student-secret",
      FEEDBACK_LOOP_COURSEWARE_ID: "courseware-123",
      FEEDBACK_LOOP_KNOWLEDGE_POINT_CODE: "J-MATH-RJ-71-05-03",
      FEEDBACK_LOOP_FEEDBACK_TEXT: "移项为什么要变号没看懂",
    },
  });

  assert.equal(plan.status, "ready");
  assert.equal(plan.missingConfig.length, 0);
  assert.equal(plan.teacherEmail, "teacher@example.com");
  assert.equal(plan.studentEmail, "student@example.com");
  assert.equal(plan.coursewareId, "courseware-123");
  assert.equal(plan.knowledgePointCode, "J-MATH-RJ-71-05-03");
  assert.equal(plan.feedbackText, "移项为什么要变号没看懂");
  assert.equal(plan.steps.length, 7);
  assert.deepEqual(
    plan.steps.map((step) => step.id),
    [
      "student-submit-feedback",
      "teacher-check-analytics",
      "teacher-open-improve",
      "teacher-generate-candidate",
      "teacher-apply-publish",
      "teacher-assign-review",
      "student-complete-review",
    ]
  );
  assert.equal(plan.steps[0]?.url, "http://localhost:4000/student/courseware/courseware-123");
  assert.equal(plan.steps[1]?.url, "http://localhost:4000/teacher/analytics");
  assert.equal(
    plan.steps[2]?.url,
    "http://localhost:4000/teacher/courseware-history/courseware-123?feedback=student#courseware-quality-instruction"
  );
  assert.equal(JSON.stringify(plan).includes("teacher-secret"), false);
  assert.equal(JSON.stringify(plan).includes("student-secret"), false);
});

test("formatFeedbackLoopBrowserAcceptanceSummary reports ready and blocked states", () => {
  const readyPlan = buildFeedbackLoopBrowserAcceptancePlan({
    env: {
      FEEDBACK_LOOP_TEACHER_EMAIL: "teacher@example.com",
      FEEDBACK_LOOP_TEACHER_PASSWORD: "teacher-secret",
      FEEDBACK_LOOP_STUDENT_EMAIL: "student@example.com",
      FEEDBACK_LOOP_STUDENT_PASSWORD: "student-secret",
      FEEDBACK_LOOP_COURSEWARE_ID: "courseware-123",
      FEEDBACK_LOOP_KNOWLEDGE_POINT_CODE: "J-MATH-RJ-71-05-03",
    },
  });
  const blockedPlan = buildFeedbackLoopBrowserAcceptancePlan({ env: {} });

  assert.equal(
    formatFeedbackLoopBrowserAcceptanceSummary(readyPlan),
    "ready: 7 browser steps"
  );
  assert.equal(
    formatFeedbackLoopBrowserAcceptanceSummary(blockedPlan),
    "blocked: 6 missing config values"
  );
});
