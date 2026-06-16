import assert from "node:assert/strict";
import test from "node:test";
import {
  assessCoursewareQuality,
  formatCoursewareQualityFeedback,
  getCoursewareQualityIssues,
} from "./courseware-quality";

const sampleCourseware = {
  knowledge_point_code: "J-MATH-RJ-71-05-03",
  learning_goals: ["会找同类项", "会移项", "会检验答案"],
  prerequisite_knowledge: [
    { title: "等式性质", description: "知道等式两边同加同减仍相等。" },
    { title: "合并同类项", description: "能把含 x 的项合并。" },
  ],
  slides: Array.from({ length: 7 }, (_, index) => ({
    title: `第 ${index + 1} 页`,
    content: "先看等式两边为什么要做相同变形，注意变号和检验。",
    knowledge_point_code: "J-MATH-RJ-71-05-03",
  })),
  examples: [
    {
      question: "解方程 4x - 3 = 2x + 5",
      solution_steps: [
        "观察：左右两边都有含 x 的项。",
        "两边同减 2x，依据是等式两边做相同操作。",
        "得到 2x - 3 = 5。",
        "两边同加 3 得到 2x = 8，再同除以 2 得到 x = 4。",
      ],
      answer: "x = 4",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
  ],
  common_mistakes: Array.from({ length: 3 }, (_, index) => ({
    mistake: `易错 ${index + 1}`,
    reason: "忘记等式两边要做相同操作。",
    correction: "每一步都写出两边同加、同减、同乘或同除。",
    knowledge_point_code: "J-MATH-RJ-71-05-03",
  })),
  practice_items: [
    {
      question: "解方程 x + 3 = 5",
      difficulty: "基础",
      answer: "x = 2",
      explanation: "两边同减 3。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      target_storyboard_step: 2,
    },
    {
      question: "解方程 2x - 1 = x + 4",
      difficulty: "易错纠正",
      answer: "x = 5",
      explanation: "先移含 x 的项，再移常数项，注意变号。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      target_storyboard_step: 4,
    },
    {
      question: "解方程 3(x - 1) = 2x + 5",
      difficulty: "拓展挑战",
      answer: "x = 8",
      explanation: "先去括号，再移项合并。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      target_storyboard_step: 6,
    },
  ],
  review_plan: [
    { timing: "当天", task: "复述移项为什么要变号。" },
    { timing: "一周后", task: "重做 2 道一元一次方程。" },
  ],
  dynamic_storyboards: [
    {
      steps: Array.from({ length: 8 }, (_, index) => ({
        step_title: `两边同做第 ${index + 1} 个变形`,
        narration: "注意本步依据是等式两边做相同操作。",
        visual_state: "原式、当前中间式和高亮项同时显示。",
        formula_or_state: "4x - 3 = 2x + 5",
        operation: "两边做相同操作",
        operation_reason: "因为等式两边做相同操作，等式仍然成立。",
        emphasis_points: ["注意变号", "别漏项"],
        student_check: "请说出这一步为什么可以这样变形。",
      })),
    },
  ],
  interactive_html: {
    html: `<!doctype html><html><head><meta charset="utf-8"><style>body{overflow:hidden}.deck{width:100vw;height:100vh;overflow:hidden}.slide{width:100%;height:100%;overflow:hidden}</style></head><body><main class="deck">${Array.from(
      { length: 7 },
      (_, index) =>
        `<section class="slide" data-layout="${
          ["cover-visual", "board-derivation", "mistake-contrast"][index % 3]
        }">重点：注意变号，回看完整过程，说明为什么。</section>`
    ).join("")}<button>上一页</button><button>下一页</button></main></body></html>`,
  },
};

test("assessCoursewareQuality passes a knowledge-point aligned courseware", () => {
  const report = assessCoursewareQuality(sampleCourseware, "2026-06-16T00:00:00.000Z");

  assert.equal(report.passedRequired, true);
  assert.equal(getCoursewareQualityIssues(report).length, 0);
});

test("assessCoursewareQuality flags content that cannot support learning effect", () => {
  const report = assessCoursewareQuality(
    {
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      slides: [{ title: "第 1 步", content: "完成本步操作", knowledge_point_code: "wrong" }],
      practice_items: [],
      interactive_html: {
        html: "<!doctype html><html><body>AI 画面</body></html>",
      },
    },
    "2026-06-16T00:00:00.000Z"
  );
  const feedback = formatCoursewareQualityFeedback(report);

  assert.equal(report.passedRequired, false);
  assert.match(feedback, /知识点主线清晰/);
  assert.match(feedback, /投屏课件无滚动/);
});
