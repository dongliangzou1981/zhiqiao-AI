import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCoursewareFeedbackStatus,
  normalizeCoursewareFeedbackLevel,
  shouldRequestTeacherHelp,
} from "./student-courseware-feedback";

test("normalizeCoursewareFeedbackLevel accepts supported student feedback levels", () => {
  assert.equal(normalizeCoursewareFeedbackLevel("understood"), "understood");
  assert.equal(normalizeCoursewareFeedbackLevel("partly_understood"), "partly_understood");
  assert.equal(normalizeCoursewareFeedbackLevel("not_understood"), "not_understood");
});

test("normalizeCoursewareFeedbackLevel rejects unsupported levels", () => {
  assert.equal(normalizeCoursewareFeedbackLevel("confused"), null);
  assert.equal(normalizeCoursewareFeedbackLevel(""), null);
  assert.equal(normalizeCoursewareFeedbackLevel(null), null);
});

test("buildCoursewareFeedbackStatus explains student understanding in teacher-friendly Chinese", () => {
  assert.deepEqual(buildCoursewareFeedbackStatus("understood", false), {
    label: "已看懂",
    tone: "positive",
    summary: "学生认为这份课件已经讲清楚，可以继续做基础练习巩固。",
  });

  assert.deepEqual(buildCoursewareFeedbackStatus("partly_understood", true), {
    label: "部分看懂，需要老师跟进",
    tone: "warning",
    summary: "学生还有不确定的环节，并主动请求老师再讲一次。",
  });

  assert.deepEqual(buildCoursewareFeedbackStatus("not_understood", false), {
    label: "没看懂",
    tone: "critical",
    summary: "学生反馈当前课件还没有讲明白，应优先回看关键步骤或等待老师讲解。",
  });
});

test("shouldRequestTeacherHelp is true when feedback means the student is stuck", () => {
  assert.equal(shouldRequestTeacherHelp("understood", false), false);
  assert.equal(shouldRequestTeacherHelp("partly_understood", false), false);
  assert.equal(shouldRequestTeacherHelp("partly_understood", true), true);
  assert.equal(shouldRequestTeacherHelp("not_understood", false), true);
});
