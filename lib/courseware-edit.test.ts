import assert from "node:assert/strict";
import test from "node:test";
import { getPracticeTargetStepOptions } from "./courseware-edit";

test("getPracticeTargetStepOptions exposes first storyboard step numbers and titles", () => {
  const options = getPracticeTargetStepOptions([
    {
      title: "一元一次方程动态演示",
      scene_type: "derivation",
      learning_objective: "看清移项与合并同类项",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      summary: "解方程要保持等式平衡",
      steps: [
        {
          step_title: "原方程",
          narration: "先观察方程左右两边。",
          visual_state: "4x - 3 = 2x + 5",
        },
        {
          step_title: "移含 x 的项",
          narration: "把含 x 的项集中到左边。",
          visual_state: "4x - 2x - 3 = 5",
        },
      ],
    },
  ]);

  assert.deepEqual(options, [
    { value: 1, label: "1. 原方程" },
    { value: 2, label: "2. 移含 x 的项" },
  ]);
});

test("getPracticeTargetStepOptions falls back to operation or formula when title is empty", () => {
  const options = getPracticeTargetStepOptions([
    {
      title: "一元一次方程动态演示",
      scene_type: "derivation",
      learning_objective: "看清完整过程",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      summary: "解方程要保持等式平衡",
      steps: [
        {
          step_title: "",
          narration: "两边同时减去 2x。",
          visual_state: "4x - 3 - 2x = 2x + 5 - 2x",
          operation: "两边同减 2x",
          formula_or_state: "4x - 3 - 2x = 2x + 5 - 2x",
        },
        {
          step_title: "",
          narration: "整理得到新的方程。",
          visual_state: "2x - 3 = 5",
          formula_or_state: "2x - 3 = 5",
        },
      ],
    },
  ]);

  assert.deepEqual(options, [
    { value: 1, label: "1. 两边同减 2x" },
    { value: 2, label: "2. 2x - 3 = 5" },
  ]);
});

test("getPracticeTargetStepOptions treats generic step titles as missing", () => {
  const options = getPracticeTargetStepOptions([
    {
      title: "一元一次方程动态演示",
      scene_type: "derivation",
      learning_objective: "看清完整过程",
      knowledge_point_code: "J-MATH-RJ-71-05-03",
      summary: "解方程要保持等式平衡",
      steps: [
        {
          step_title: "第 4 步",
          narration: "把含 x 的项集中到左边。",
          visual_state: "2x - 3 = 5",
          operation: "移含 x 的项",
          formula_or_state: "2x - 3 = 5",
        },
      ],
    },
  ]);

  assert.deepEqual(options, [{ value: 1, label: "1. 移含 x 的项" }]);
});
