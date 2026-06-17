import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidDueDate,
  normalizeTeacherReviewAssignmentRequest,
} from "./teacher-review-assignment";

const today = new Date("2026-06-17T12:00:00.000Z");
const studentId = "11111111-1111-4111-8111-111111111111";

test("normalizeTeacherReviewAssignmentRequest accepts a valid assignment", () => {
  assert.deepEqual(
    normalizeTeacherReviewAssignmentRequest(
      {
        knowledgePointCode: "J-MATH-RJ-71-05-03",
        studentIds: [studentId, studentId],
        dueDate: "2026-06-18",
      },
      today
    ),
    {
      ok: true,
      value: {
        knowledgePointCode: "J-MATH-RJ-71-05-03",
        studentIds: [studentId],
        dueDate: "2026-06-18",
      },
    }
  );
});

test("normalizeTeacherReviewAssignmentRequest rejects missing fields", () => {
  assert.deepEqual(normalizeTeacherReviewAssignmentRequest({}, today), {
    ok: false,
    status: 400,
    error: "缺少知识点编号",
  });

  assert.deepEqual(
    normalizeTeacherReviewAssignmentRequest(
      { knowledgePointCode: "J-MATH-RJ-71-05-03", studentIds: [], dueDate: "2026-06-18" },
      today
    ),
    {
      ok: false,
      status: 400,
      error: "请选择要布置复习的学生",
    }
  );
});

test("normalizeTeacherReviewAssignmentRequest rejects invalid students and dates", () => {
  assert.deepEqual(
    normalizeTeacherReviewAssignmentRequest(
      {
        knowledgePointCode: "J-MATH-RJ-71-05-03",
        studentIds: ["not-a-uuid"],
        dueDate: "2026-06-18",
      },
      today
    ),
    {
      ok: false,
      status: 400,
      error: "学生ID无效",
    }
  );

  assert.deepEqual(
    normalizeTeacherReviewAssignmentRequest(
      {
        knowledgePointCode: "J-MATH-RJ-71-05-03",
        studentIds: [studentId],
        dueDate: "2026-02-30",
      },
      today
    ),
    {
      ok: false,
      status: 400,
      error: "请选择今天或之后的有效到期日",
    }
  );
});

test("isValidDueDate rejects dates before today", () => {
  assert.equal(isValidDueDate("2026-06-16", today), false);
  assert.equal(isValidDueDate("2026-06-17", today), true);
});
