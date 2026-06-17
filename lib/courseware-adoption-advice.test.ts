import assert from "node:assert/strict";
import test from "node:test";
import { buildCoursewareAdoptionAdvice } from "./courseware-adoption-advice";
import type { CoursewareQualityReport } from "./courseware-quality";

function makeReport(score: number, passedRequired: boolean): CoursewareQualityReport {
  return {
    version: "courseware_quality_v1",
    score,
    passedRequired,
    generatedAt: "2026-06-17T00:00:00.000Z",
    checks: [],
  };
}

test("buildCoursewareAdoptionAdvice recommends adoption for high-quality candidate", () => {
  const advice = buildCoursewareAdoptionAdvice({
    before: makeReport(82, true),
    after: makeReport(93, true),
  });

  assert.equal(advice.level, "adopt");
  assert.equal(advice.title, "建议采用新版");
  assert(advice.reasons.some((item) => item.includes("质量分提升 11 分")));
});

test("buildCoursewareAdoptionAdvice recommends trial when score improves but still needs review", () => {
  const advice = buildCoursewareAdoptionAdvice({
    before: makeReport(68, false),
    after: makeReport(82, false),
  });

  assert.equal(advice.level, "trial");
  assert.equal(advice.title, "可试讲，但需先复核");
});

test("buildCoursewareAdoptionAdvice warns when candidate quality drops", () => {
  const advice = buildCoursewareAdoptionAdvice({
    before: makeReport(88, true),
    after: makeReport(80, true),
  });

  assert.equal(advice.level, "hold");
  assert.equal(advice.title, "建议暂缓采用");
  assert(advice.reasons.some((item) => item.includes("质量分下降 8 分")));
});
