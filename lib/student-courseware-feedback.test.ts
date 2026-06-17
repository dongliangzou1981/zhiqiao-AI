import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCoursewareFeedbackFollowUpFromSignals,
  buildCoursewareFeedbackFollowUpStatus,
  buildCoursewareFeedbackImprovementSummary,
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

test("buildCoursewareFeedbackFollowUpStatus prioritizes published courseware", () => {
  assert.deepEqual(
    buildCoursewareFeedbackFollowUpStatus({
      hasTeacherReviewAfterFeedback: true,
      hasPendingRevisionAfterFeedback: true,
      hasPublishedAfterFeedback: true,
    }),
    {
      label: "已发布新版",
      tone: "published",
      summary: "学生反馈后，老师已经发布新版课件，可继续观察学生复习和后续反馈。",
    }
  );
});

test("buildCoursewareFeedbackFollowUpStatus distinguishes revision and review actions", () => {
  assert.equal(
    buildCoursewareFeedbackFollowUpStatus({
      hasPendingRevisionAfterFeedback: true,
    }).label,
    "已有优化候选"
  );
  assert.equal(
    buildCoursewareFeedbackFollowUpStatus({
      hasTeacherReviewAfterFeedback: true,
    }).label,
    "已布置复习"
  );
  assert.equal(buildCoursewareFeedbackFollowUpStatus({}).label, "待跟进");
});

test("buildCoursewareFeedbackFollowUpFromSignals ignores actions before the feedback", () => {
  const status = buildCoursewareFeedbackFollowUpFromSignals(
    {
      user_id: "student-1",
      courseware_id: "courseware-1",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      updated_at: "2026-06-17T10:00:00.000Z",
    },
    {
      tasks: [
        {
          user_id: "student-1",
          knowledge_point_code: "J-MATH-RJ-71-05-03",
          task_type: "teacher_review",
          created_at: "2026-06-17T09:59:00.000Z",
        },
      ],
      revisions: [],
      coursewares: [],
    }
  );

  assert.equal(status.label, "待跟进");
});

test("buildCoursewareFeedbackFollowUpFromSignals prioritizes published courseware", () => {
  const status = buildCoursewareFeedbackFollowUpFromSignals(
    {
      user_id: "student-1",
      courseware_id: "courseware-1",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      updated_at: "2026-06-17T10:00:00.000Z",
    },
    {
      tasks: [
        {
          user_id: "student-1",
          knowledge_point_code: "J-MATH-RJ-71-05-03",
          task_type: "teacher_review",
          created_at: "2026-06-17T10:01:00.000Z",
        },
      ],
      revisions: [
        {
          courseware_id: "courseware-1",
          status: "pending",
          created_at: "2026-06-17T10:02:00.000Z",
          applied_at: null,
        },
      ],
      coursewares: [
        {
          id: "courseware-1",
          is_published: true,
          published_at: "2026-06-17T10:03:00.000Z",
        },
      ],
    }
  );

  assert.equal(status.label, "已发布新版");
});

test("buildCoursewareFeedbackImprovementSummary returns empty text when feedback has no issue", () => {
  assert.equal(
    buildCoursewareFeedbackImprovementSummary([
      {
        understanding_level: "understood",
        need_teacher_help: false,
        feedback_text: "已经看懂了",
      },
    ]),
    ""
  );
});

test("buildCoursewareFeedbackImprovementSummary summarizes one stuck student", () => {
  assert.equal(
    buildCoursewareFeedbackImprovementSummary([
      {
        understanding_level: "not_understood",
        need_teacher_help: true,
        feedback_text: "去括号这一步为什么要变号？",
      },
    ]),
    "1 名学生反馈这份课件还没有完全讲透，其中 1 名没看懂，1 名希望老师再讲一次。学生说明：“去括号这一步为什么要变号？”。请基于这些反馈补全关键步骤推导，讲慢一点，并减少 AI 套话。"
  );
});

test("buildCoursewareFeedbackImprovementSummary summarizes several student signals", () => {
  assert.equal(
    buildCoursewareFeedbackImprovementSummary([
      {
        understanding_level: "not_understood",
        need_teacher_help: true,
        feedback_text: "移项为什么要变号",
      },
      {
        understanding_level: "partly_understood",
        need_teacher_help: false,
        feedback_text: "两边同除以 2 还能跟上，前面移项有点快",
      },
      {
        understanding_level: "understood",
        need_teacher_help: true,
        feedback_text: "想让老师再讲一道同类题",
      },
    ]),
    "3 名学生反馈这份课件还没有完全讲透，其中 1 名没看懂，1 名部分看懂，2 名希望老师再讲一次。学生说明：“移项为什么要变号”；“两边同除以 2 还能跟上，前面移项有点快”；“想让老师再讲一道同类题”。请基于这些反馈补全关键步骤推导，讲慢一点，并减少 AI 套话。"
  );
});

test("buildCoursewareFeedbackImprovementSummary truncates long summaries", () => {
  const summary = buildCoursewareFeedbackImprovementSummary([
    {
      understanding_level: "not_understood",
      need_teacher_help: true,
      feedback_text:
        "这一步完全没有看懂，尤其是先移含 x 的项再移常数项时，我不知道为什么左边右边都要做同样的操作，也不知道每一步是不是还能保持等式成立。",
    },
    {
      understanding_level: "not_understood",
      need_teacher_help: true,
      feedback_text:
        "希望老师把动态演示讲慢一点，每次变形之前先说目标，再说为什么可以这么做，最后再让我们检查一次。",
    },
    {
      understanding_level: "partly_understood",
      need_teacher_help: true,
      feedback_text:
        "题目能抄下来，但是例题到练习之间跳得太快，不知道练习题应该回看动态演示的哪一步。",
    },
    {
      understanding_level: "partly_understood",
      need_teacher_help: true,
      feedback_text: "还需要更多同类题。",
    },
  ]);

  assert.ok(summary.length <= 280);
  assert.match(summary, /…/);
});
