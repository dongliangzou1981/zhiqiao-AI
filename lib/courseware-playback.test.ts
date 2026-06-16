import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPracticeReplaySuggestion,
  buildTeachingPanels,
  getBuiltInDynamicStoryboard,
  getDynamicReplayTargetId,
  getInitialPlaybackStepIndex,
} from "./courseware-playback";

test("buildTeachingPanels keeps state transition and ordered teaching checks", () => {
  const panels = buildTeachingPanels({
    previousStep: {
      step_title: "原方程",
      narration: "观察左右两边。",
      visual_state: "4x - 3 = 2x + 5",
      formula_or_state: "4x - 3 = 2x + 5",
      operation: "观察同类项",
      operation_reason: "先不移动，避免跳步。",
      emphasis_points: ["含 x 的项", "常数项"],
      teacher_prompt: "左右两边分别有什么？",
      student_check: "我能找出每一项。",
    },
    currentStep: {
      step_title: "两边同减 2x",
      narration: "右边含 x 的项要消去。",
      visual_state: "4x - 3 - 2x = 2x + 5 - 2x",
      formula_or_state: "4x - 3 - 2x = 2x + 5 - 2x",
      operation: "两边同时减去 2x",
      operation_reason: "等式两边做同样操作，等式仍成立。",
      emphasis_points: ["不能只减一边", "2x - 2x = 0"],
      teacher_prompt: "为什么两边都要减？",
      student_check: "我能说明等式仍成立。",
    },
  });

  assert.deepEqual(
    panels.map((panel) => panel.title),
    ["上一画面", "当前画面", "本步操作", "为什么可以这样做", "学生自查"]
  );
  assert.equal(panels[0].body, "4x - 3 = 2x + 5");
  assert.equal(panels[1].body, "4x - 3 - 2x = 2x + 5 - 2x");
  assert.deepEqual(panels[2].emphasis, ["不能只减一边", "2x - 2x = 0"]);
  assert.match(panels[4].body, /我能说明等式仍成立/);
});

test("buildPracticeReplaySuggestion points a practice item to the closest dynamic step", () => {
  const suggestion = buildPracticeReplaySuggestion({
    knowledgePointCode: "J-MATH-RJ-71-05-03",
    practiceItem: {
      question: "解方程 4x - 3 = 2x + 5，注意先找同类项再移项。",
      difficulty: "基础",
      answer: "x = 4",
      explanation: "先找含 x 的同类项，再把含 x 的项移到等号一边。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
    storyboards: [
      {
        title: "一元一次方程完整演化",
        scene_type: "derivation",
        learning_objective: "看清解方程每一步",
        knowledge_point_code: "J-MATH-RJ-71-05-03",
        summary: "不能跳步。",
        steps: [
          {
            step_title: "找同类项",
            narration: "观察左右两边的含 x 项和常数项。",
            visual_state: "4x - 3 = 2x + 5",
            operation: "找出同类项",
            operation_reason: "先分类，后移动。",
            emphasis_points: ["含 x 的项", "常数项"],
            student_check: "我能找出同类项。",
          },
          {
            step_title: "系数化为 1",
            narration: "两边同除以系数。",
            visual_state: "x = 4",
            operation: "求出 x",
            operation_reason: "得到一个 x。",
            emphasis_points: ["同除以系数"],
            student_check: "我能算出答案。",
          },
        ],
      },
    ],
  });

  assert.equal(suggestion?.stepIndex, 0);
  assert.equal(suggestion?.stepTitle, "找同类项");
  assert.match(suggestion?.reason ?? "", /同类项/);
});

test("buildPracticeReplaySuggestion prefers explicit target storyboard step", () => {
  const suggestion = buildPracticeReplaySuggestion({
    knowledgePointCode: "J-MATH-RJ-71-05-03",
    practiceItem: {
      question: "解方程 4x - 3 = 2x + 5，先找同类项。",
      difficulty: "基础",
      answer: "x = 4",
      explanation: "这道题虽然提到同类项，但生成阶段已指定先回看两边同减 2x。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      target_storyboard_step: 2,
    },
    storyboards: [
      {
        title: "一元一次方程完整演化",
        scene_type: "derivation",
        learning_objective: "看清解方程每一步",
        knowledge_point_code: "J-MATH-RJ-71-05-03",
        summary: "不能跳步。",
        steps: [
          {
            step_title: "找同类项",
            narration: "观察左右两边的含 x 项和常数项。",
            visual_state: "4x - 3 = 2x + 5",
            operation: "找出同类项",
            operation_reason: "先分类，后移动。",
            emphasis_points: ["含 x 的项", "常数项"],
            student_check: "我能找出同类项。",
          },
          {
            step_title: "两边同减 2x",
            narration: "等式两边同时减去 2x。",
            visual_state: "4x - 3 - 2x = 2x + 5 - 2x",
            operation: "两边同减 2x",
            operation_reason: "等式两边做同样操作。",
            emphasis_points: ["不能只减一边"],
            student_check: "我能说明等式仍成立。",
          },
        ],
      },
    ],
  });

  assert.equal(suggestion?.stepIndex, 1);
  assert.equal(suggestion?.stepTitle, "两边同减 2x");
  assert.match(suggestion?.reason ?? "", /课件已标注/);
});

test("buildPracticeReplaySuggestion falls back to built-in dynamic steps", () => {
  const suggestion = buildPracticeReplaySuggestion({
    knowledgePointCode: "J-MATH-RJ-71-05-03",
    practiceItem: {
      question: "解方程 \\(4x - 3 = 2x + 5\\)。",
      difficulty: "基础",
      answer: "x = 4",
      explanation: "先整理含 x 的项，再整理常数项，最后系数化为 1。",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
    },
    storyboards: undefined,
  });

  assert.ok(suggestion);
  assert.ok(suggestion.stepIndex >= 0);
  assert.match(suggestion.stepTitle, /原方程|整理目标|含 x|系数/);
});

test("getInitialPlaybackStepIndex clamps requested dynamic step", () => {
  assert.equal(getInitialPlaybackStepIndex(3, 8), 3);
  assert.equal(getInitialPlaybackStepIndex(-1, 8), 0);
  assert.equal(getInitialPlaybackStepIndex(99, 8), 7);
  assert.equal(getInitialPlaybackStepIndex(null, 8), 0);
  assert.equal(getInitialPlaybackStepIndex(2, 0), 0);
});

test("getDynamicReplayTargetId creates stable DOM target ids", () => {
  assert.equal(
    getDynamicReplayTargetId("bc26231a-e161-4214-bfd2-3ae5d605bec5"),
    "dynamic-courseware-bc26231a-e161-4214-bfd2-3ae5d605bec5"
  );
  assert.equal(
    getDynamicReplayTargetId("courseware id with spaces"),
    "dynamic-courseware-courseware-id-with-spaces"
  );
});

test("getBuiltInDynamicStoryboard provides a detailed number line storyboard", () => {
  const storyboard = getBuiltInDynamicStoryboard("J-MATH-RJ-71-01-03");

  assert.ok(storyboard);
  assert.equal(storyboard.knowledge_point_code, "J-MATH-RJ-71-01-03");
  assert.ok(storyboard.steps.length >= 8);
  assert.deepEqual(
    storyboard.steps.slice(0, 4).map((step) => step.step_title),
    ["认识数轴三要素", "确定原点", "确定正方向", "确定单位长度"]
  );
  assert.match(storyboard.steps[4].visual_state, /2 在原点右侧/);
  assert.match(storyboard.steps[6].operation_reason ?? "", /到原点的距离/);
});
