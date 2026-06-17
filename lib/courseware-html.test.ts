import assert from "node:assert/strict";
import test from "node:test";
import { buildCoursewareTemplateInteractiveHtml } from "./courseware-html";
import { assessCoursewareQuality, getCoursewareQualityIssues } from "./courseware-quality";
import type { CoursewareJson } from "./courseware-json";

const knowledgePointCode = "J-MATH-RJ-71-05-03";

function buildTemplateCourseware(): CoursewareJson {
  return {
    version: "courseware_json_v1",
    knowledge_point_code: knowledgePointCode,
    knowledge_point_name: "一元一次方程的解法",
    subject: "数学",
    grade: "七年级",
    semester: "上册",
    chapter: "一元一次方程",
    learning_goals: ["理解等式性质", "会移项合并同类项", "能解释每一步为什么成立"],
    prerequisite_knowledge: [
      { title: "等式性质", description: "等式两边同时加减同一个数，结果仍相等。" },
      { title: "合并同类项", description: "把含 x 的项和常数项分别整理。" },
    ],
    core_concept: {
      title: "方程变形要保持等价",
      explanation: "解一元一次方程时，每一步变形都要说明依据，尤其是去括号、移项和合并同类项。",
    },
    slides: Array.from({ length: 7 }, (_, index) => ({
      slide_type: index === 0 ? "cover" : "derivation",
      title: `移项解方程环节 ${index + 1}`,
      content:
        "先观察方程两边的含 x 项和常数项，再用等式性质逐步整理，强调移项变号的理由。",
      knowledge_point_code: knowledgePointCode,
      teacher_notes: "让学生说出为什么两边同减同一个式子后方程仍等价。",
    })),
    examples: [
      {
        title: "例题：4x - 3 = 2x + 5",
        question: "解方程 4x - 3 = 2x + 5",
        solution_steps: [
          "两边同减 2x，得到 2x - 3 = 5。",
          "两边同加 3，得到 2x = 8。",
          "两边同除以 2，得到 x = 4。",
          "把 x = 4 代回原方程，左右两边相等。",
        ],
        answer: "x = 4",
        knowledge_point_code: knowledgePointCode,
      },
    ],
    common_mistakes: [
      {
        mistake: "移项忘记变号",
        reason: "没有把移项理解为两边同时加减同一项。",
        correction: "先写出两边同减 2x，再合并同类项。",
        knowledge_point_code: knowledgePointCode,
      },
      {
        mistake: "去括号漏乘",
        reason: "括号前的系数没有乘到每一项。",
        correction: "用标记圈出括号内每一项，逐项相乘。",
        knowledge_point_code: knowledgePointCode,
      },
      {
        mistake: "合并常数项出错",
        reason: "没有区分正负号。",
        correction: "把符号和数字一起移动、一起计算。",
        knowledge_point_code: knowledgePointCode,
      },
    ],
    practice_items: [
      {
        question: "解方程 x + 3 = 5",
        difficulty: "基础",
        answer: "x = 2",
        explanation: "两边同减 3。",
        knowledge_point_code: knowledgePointCode,
        target_storyboard_step: 2,
      },
      {
        question: "解方程 2x - 1 = x + 4",
        difficulty: "易错纠正",
        answer: "x = 5",
        explanation: "先把含 x 的项移到一边，并解释变号理由。",
        knowledge_point_code: knowledgePointCode,
        target_storyboard_step: 4,
      },
      {
        question: "解方程 3(x - 1) = 2x + 5",
        difficulty: "拓展挑战",
        answer: "x = 8",
        explanation: "先去括号，再移项合并同类项。",
        knowledge_point_code: knowledgePointCode,
        target_storyboard_step: 6,
      },
    ],
    summary_points: ["等价变形是核心", "移项本质是两边同加减", "验算能发现符号错误"],
    review_plan: [
      { timing: "课后当天", task: "复盘移项变号的理由。" },
      { timing: "一周后", task: "完成一道含括号的一元一次方程。" },
    ],
    dynamic_storyboards: [
      {
        title: "移项变号的动态推导",
        scene_type: "derivation",
        learning_objective: "看清每一步等价变形的依据。",
        knowledge_point_code: knowledgePointCode,
        steps: Array.from({ length: 8 }, (_, index) => ({
          step_title: `整理含 x 项环节 ${index + 1}`,
          narration: "用等式性质解释为什么这一项可以移动，并强调符号要一起变化。",
          visual_state: "把含 x 的项标记到左边，把常数项标记到右边。",
          formula_or_state: "4x - 3 = 2x + 5",
          operation: "两边同减 2x",
          operation_reason: "等式两边同减同一个式子，左右仍相等，所以方程等价。",
          emphasis_points: ["移项要变号", "每一步说明依据"],
          teacher_prompt: "这一项为什么从右边到了左边？",
          student_check: "学生能说出两边同减 2x，而不是机械说移项。",
        })),
        summary: "把机械移项还原成等式性质，降低符号错误。",
      },
    ],
  };
}

test("buildCoursewareTemplateInteractiveHtml builds a complete projection-ready deck", () => {
  const courseware = buildTemplateCourseware();
  const interactiveHtml = buildCoursewareTemplateInteractiveHtml(courseware);
  const html = interactiveHtml.html;

  assert.match(html, /<!doctype html>/i);
  assert.equal(
    (html.match(/<section class="slide"/g) ?? []).length >= 6,
    true
  );
  assert.equal(new Set([...html.matchAll(/data-layout="([^"]+)"/g)].map((match) => match[1])).size >= 3, true);
  assert.match(html, /\.deck\{width:100vw;height:100vh/);
  assert.match(html, /\.slide\{width:100%;height:100%;/);
  assert.match(html, /body\{overflow:hidden\}/);
});

test("buildCoursewareTemplateInteractiveHtml passes existing required quality checks", () => {
  const courseware = buildTemplateCourseware();
  const interactiveHtml = buildCoursewareTemplateInteractiveHtml(courseware);
  const report = assessCoursewareQuality(
    {
      ...courseware,
      interactive_html: interactiveHtml,
    },
    "2026-06-17T00:00:00.000Z"
  );
  const requiredIssues = getCoursewareQualityIssues(report).filter(
    (issue) => issue.severity === "required"
  );

  assert.equal(report.passedRequired, true);
  assert.deepEqual(requiredIssues, []);
});
