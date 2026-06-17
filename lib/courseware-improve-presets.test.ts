import assert from "node:assert/strict";
import test from "node:test";
import { coursewareImprovePresets, getCoursewareImprovePresetText } from "./courseware-improve-presets";

test("coursewareImprovePresets provides teacher-friendly preset options", () => {
  assert(coursewareImprovePresets.some((preset) => preset.label === "补全推导"));
  assert(coursewareImprovePresets.some((preset) => preset.label === "减少 AI 腔"));
  assert(coursewareImprovePresets.some((preset) => preset.label === "优化投屏"));
});

test("getCoursewareImprovePresetText returns preset instruction by id", () => {
  assert.equal(
    getCoursewareImprovePresetText("complete-derivation"),
    "补全关键推导步骤，每一步都说明为什么这样变形，不能跳步。"
  );
});

test("getCoursewareImprovePresetText returns empty string for unknown id", () => {
  assert.equal(getCoursewareImprovePresetText("unknown"), "");
});
