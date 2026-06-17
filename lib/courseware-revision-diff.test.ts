import assert from "node:assert/strict";
import test from "node:test";
import { buildCoursewareRevisionDiffSummary } from "./courseware-revision-diff";
import type { CoursewareQualityReport } from "./courseware-quality";
import type { CoursewareJson } from "./courseware-types";

const baseQuality: CoursewareQualityReport = {
  version: "courseware_quality_v1",
  score: 78,
  passedRequired: false,
  generatedAt: "2026-06-17T00:00:00.000Z",
  checks: [],
};

const improvedQuality: CoursewareQualityReport = {
  ...baseQuality,
  score: 91,
  passedRequired: true,
};

const basicDifficulty = "?箇?" as CoursewareJson["practice_items"][number]["difficulty"];
const mistakeDifficulty = "??蝥迤" as CoursewareJson["practice_items"][number]["difficulty"];

const currentCourseware: CoursewareJson = {
  version: "courseware_json_v1",
  knowledge_point_code: "J-MATH-RJ-71-05-03",
  knowledge_point_name: "一元一次方程的解法",
  subject: "数学",
  grade: "七年级",
  semester: "上册",
  chapter: "一元一次方程",
  learning_goals: ["理解等式变形"],
  prerequisite_knowledge: [],
  core_concept: { title: "等式变形", explanation: "方程两边做同样变形。" },
  slides: [
    {
      slide_type: "intro",
      title: "导入",
      content: "观察方程",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
    {
      slide_type: "example",
      title: "例题",
      content: "分步解方程",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
  ],
  examples: [],
  common_mistakes: [],
  practice_items: [
    {
      question: "x+1=3",
      difficulty: basicDifficulty,
      answer: "x=2",
      explanation: "两边同时减 1。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
  ],
  summary_points: [],
  review_plan: [],
  dynamic_storyboards: [
    {
      title: "解方程演示",
      scene_type: "derivation",
      learning_objective: "化成 x=a",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      summary: "保持等式两边平衡。",
      steps: [
        {
          step_title: "观察方程",
          narration: "先看未知数在哪里。",
          visual_state: "x+1=3",
          operation_reason: "确定第一步变形依据。",
          emphasis_points: ["观察未知数"],
        },
      ],
    },
  ],
};

const candidateCourseware: CoursewareJson = {
  ...currentCourseware,
  slides: [
    ...currentCourseware.slides,
    {
      slide_type: "mistake",
      title: "易错提醒",
      content: "移项时符号会改变。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
  ],
  practice_items: [
    ...currentCourseware.practice_items,
    {
      question: "2x=8",
      difficulty: mistakeDifficulty,
      answer: "x=4",
      explanation: "两边同时除以 2。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
  ],
  dynamic_storyboards: [
    {
      ...currentCourseware.dynamic_storyboards![0],
      steps: [
        ...currentCourseware.dynamic_storyboards![0].steps,
        {
          step_title: "两边同除",
          narration: "把 x 前面的系数消掉。",
          visual_state: "x=4",
          operation_reason: "等式两边同除不改变相等关系。",
          emphasis_points: ["两边同除"],
        },
      ],
    },
  ],
};

test("buildCoursewareRevisionDiffSummary explains candidate changes for teachers", () => {
  const summary = buildCoursewareRevisionDiffSummary({
    currentCourseware,
    candidateCourseware,
    qualityBefore: baseQuality,
    qualityAfter: improvedQuality,
  });

  assert.equal(summary.scoreDelta, 13);
  assert.equal(summary.highlights[0], "内容质量分提升 13 分，必选项已通过。");
  assert(summary.highlights.some((item) => item.includes("幻灯片从 2 页增加到 3 页")));
  assert(summary.highlights.some((item) => item.includes("动态讲解步骤从 1 步增加到 2 步")));
  assert(summary.highlights.some((item) => item.includes("基础练习从 1 道增加到 2 道")));
  assert(summary.slideTitleChanges.some((item) => item.includes("易错提醒")));
});
