import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCoursewareStoryboardsForDisplay,
  normalizeDynamicStoryboards,
} from "./courseware-storyboard";

const params = {
  knowledge_point_code: "J-MATH-RJ-71-05-03",
  knowledge_point_name: "一元一次方程的解法",
  slides: [
    {
      slide_type: "concept",
      title: "移项",
      content: "移项要变号。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
  ],
  examples: [],
};

test("normalizeDynamicStoryboards replaces generic step titles with concrete formula states", () => {
  const [storyboard] = normalizeDynamicStoryboards(
    [
      {
        title: "一元一次方程完整演化",
        scene_type: "derivation",
        learning_objective: "看清每一步变形",
        knowledge_point_code: "J-MATH-RJ-71-05-03",
        summary: "每一步都要说明依据",
        steps: Array.from({ length: 6 }, (_, index) => ({
          step_title: `第 ${index + 1} 步`,
          narration: "这一步不能跳过。",
          visual_state:
            index === 3 ? "2x - 3 = 5" : `第 ${index + 1} 个中间状态`,
          formula_or_state:
            index === 3 ? "2x - 3 = 5" : `state-${index + 1}`,
          operation: "按顺序完成本步变形",
          operation_reason: "保持等式两边平衡。",
          emphasis_points: ["不要跳步"],
          student_check: "我能说出这一步的依据。",
        })),
      },
    ],
    params
  );

  assert.equal(storyboard.steps[3].step_title, "2x - 3 = 5");
  assert.equal(storyboard.steps[3].operation, "按顺序完成本步变形");
});

test("normalizeCoursewareStoryboardsForDisplay creates a generic fallback only when no storyboard exists", () => {
  const courseware = {
    version: "courseware_json_v1" as const,
    knowledge_point_code: "J-MATH-RJ-71-01-03",
    knowledge_point_name: "数轴",
    subject: "数学",
    grade: "七年级",
    semester: "上册",
    chapter: "有理数",
    learning_goals: [],
    prerequisite_knowledge: [],
    core_concept: {
      title: "数轴",
      explanation: "认识数轴。",
    },
    slides: [],
    examples: [],
    common_mistakes: [],
    practice_items: [],
    summary_points: [],
    review_plan: [],
  };

  const normalized = normalizeCoursewareStoryboardsForDisplay(courseware);

  assert.notEqual(normalized, courseware);
  assert.equal(normalized.dynamic_storyboards?.[0]?.title, "数轴完整演化过程");
  assert.equal(normalized.dynamic_storyboards?.[0]?.steps[0]?.step_title, "第 1 步");
});

test("normalizeDynamicStoryboards preserves AI storyboard instead of replacing it with a fixed built-in one", () => {
  const [storyboard] = normalizeDynamicStoryboards(
    [
      {
        title: "粗略分镜",
        scene_type: "derivation",
        learning_objective: "看清过程",
        knowledge_point_code: "J-MATH-RJ-71-05-03",
        summary: "完整过程",
        steps: Array.from({ length: 8 }, (_, index) => ({
          step_title: `第 ${index + 1} 步`,
          narration: "按顺序完成本步变形",
          visual_state: "按顺序完成本步变形",
          formula_or_state: "按顺序完成本步变形",
          operation: "按顺序完成本步变形",
          operation_reason: "帮助学生理解本步骤的依据。",
          emphasis_points: ["不要跳步"],
          student_check: "我能说出这一步的操作和原因。",
        })),
      },
    ],
    params
  );

  assert.equal(storyboard.title, "粗略分镜");
  assert.equal(storyboard.steps.length, 8);
  assert.equal(storyboard.steps[0].step_title, "按顺序完成本步变形");
});

test("normalizeDynamicStoryboards preserves AI number line storyboard instead of replacing it", () => {
  const [storyboard] = normalizeDynamicStoryboards(
    [
      {
        title: "粗略数轴分镜",
        scene_type: "number_line",
        learning_objective: "认识数轴",
        knowledge_point_code: "J-MATH-RJ-71-01-03",
        summary: "看懂数轴",
        steps: Array.from({ length: 8 }, (_, index) => ({
          step_title: `第 ${index + 1} 步`,
          narration: "按顺序完成本步变形",
          visual_state: "按顺序完成本步变形",
          formula_or_state: "按顺序完成本步变形",
          operation: "按顺序完成本步变形",
          operation_reason: "帮助学生理解本步骤的依据。",
          emphasis_points: ["不要跳步"],
          student_check: "我能说出这一步的操作和原因。",
        })),
      },
    ],
    {
      ...params,
      knowledge_point_code: "J-MATH-RJ-71-01-03",
      knowledge_point_name: "数轴",
    }
  );

  assert.equal(storyboard.title, "粗略数轴分镜");
  assert.equal(storyboard.scene_type, "number_line");
  assert.equal(storyboard.steps.length, 8);
});

test("normalizeDynamicStoryboards preserves AI visual elements for slideshow rendering", () => {
  const [storyboard] = normalizeDynamicStoryboards(
    [
      {
        title: "AI visual storyboard",
        scene_type: "process",
        learning_objective: "Show each transformation clearly",
        knowledge_point_code: "J-MATH-RJ-71-05-03",
        summary: "Students see the complete process.",
        steps: Array.from({ length: 6 }, (_, index) => ({
          step_title: `Step ${index + 1}`,
          narration: "Keep every learning step visible.",
          visual_state: "4x - 3 = 2x + 5",
          formula_or_state: "4x - 3 = 2x + 5",
          visual_elements: [
            {
              kind: "formula",
              role: "primary",
              text: "4x - 3 = 2x + 5",
              group: "equation",
            },
            {
              kind: "highlight",
              role: "emphasis",
              text: "同类项必须先找全",
              items: ["4x", "2x"],
            },
          ],
          operation: "Find like terms",
          operation_reason: "Students need to know why each term moves.",
          emphasis_points: ["Do not skip the observation step."],
          student_check: "Which terms contain x?",
        })),
      },
    ],
    params
  );

  assert.equal(storyboard.steps[0].visual_elements?.[0]?.kind, "formula");
  assert.equal(storyboard.steps[0].visual_elements?.[0]?.role, "primary");
  assert.equal(storyboard.steps[0].visual_elements?.[1]?.text, "同类项必须先找全");
  assert.deepEqual(storyboard.steps[0].visual_elements?.[1]?.items, ["4x", "2x"]);
});
