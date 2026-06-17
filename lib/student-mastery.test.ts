import test from "node:test";
import assert from "node:assert/strict";
import { buildMasteryDraft } from "./student-mastery";

const userId = "student-1";
const point = {
  code: "J-MATH-RJ-71-05-03",
  name: "一元一次方程的解法",
};

function buildStableLearningInput() {
  return {
    userId,
    code: point.code,
    name: point.name,
    records: [
      {
        knowledge_point_code: point.code,
        knowledge_point_name: point.name,
        is_correct: true,
        created_at: "2026-06-17T09:00:00.000Z",
      },
      {
        knowledge_point_code: point.code,
        knowledge_point_name: point.name,
        is_correct: true,
        created_at: "2026-06-16T09:00:00.000Z",
      },
      {
        knowledge_point_code: point.code,
        knowledge_point_name: point.name,
        is_correct: true,
        created_at: "2026-06-15T09:00:00.000Z",
      },
    ],
    tasks: [],
    progressRows: [
      {
        knowledge_point_code: point.code,
        knowledge_point_name: point.name,
        status: "completed" as const,
        last_viewed_at: "2026-06-17T08:00:00.000Z",
        completed_at: "2026-06-17T08:30:00.000Z",
      },
    ],
  };
}

test("buildMasteryDraft lowers mastery when feedback says the student is stuck", () => {
  const draft = buildMasteryDraft({
    ...buildStableLearningInput(),
    feedbackRows: [
      {
        knowledge_point_code: point.code,
        knowledge_point_name: point.name,
        understanding_level: "not_understood",
        need_teacher_help: true,
        updated_at: "2026-06-17T10:00:00.000Z",
      },
    ],
  });

  assert.equal(draft.mastery_score, 50);
  assert.equal(draft.mastery_level, "needs_work");
  assert.ok(draft.reasons.includes("学生反馈没看懂/需要老师跟进"));
});

test("buildMasteryDraft applies a lighter penalty for partly understood feedback", () => {
  const draft = buildMasteryDraft({
    ...buildStableLearningInput(),
    feedbackRows: [
      {
        knowledge_point_code: point.code,
        knowledge_point_name: point.name,
        understanding_level: "partly_understood",
        need_teacher_help: false,
        updated_at: "2026-06-17T10:00:00.000Z",
      },
    ],
  });

  assert.equal(draft.mastery_score, 62);
  assert.equal(draft.mastery_level, "basic");
  assert.ok(draft.reasons.includes("学生反馈仍有环节不确定"));
});

test("buildMasteryDraft does not mark stable mastery from understood feedback alone", () => {
  const draft = buildMasteryDraft({
    userId,
    code: point.code,
    name: point.name,
    records: [],
    tasks: [],
    progressRows: [],
    feedbackRows: [
      {
        knowledge_point_code: point.code,
        knowledge_point_name: point.name,
        understanding_level: "understood",
        need_teacher_help: false,
        updated_at: "2026-06-17T10:00:00.000Z",
      },
    ],
  });

  assert.equal(draft.mastery_score, 5);
  assert.equal(draft.mastery_level, "needs_work");
  assert.ok(draft.reasons.includes("学生反馈已经看懂"));
});

test("buildMasteryDraft uses feedback update time as latest activity", () => {
  const draft = buildMasteryDraft({
    ...buildStableLearningInput(),
    feedbackRows: [
      {
        knowledge_point_code: point.code,
        knowledge_point_name: point.name,
        understanding_level: "partly_understood",
        need_teacher_help: false,
        updated_at: "2026-06-18T10:00:00.000Z",
      },
    ],
  });

  assert.equal(draft.last_activity_at, "2026-06-18T10:00:00.000Z");
});
