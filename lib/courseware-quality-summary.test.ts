import assert from "node:assert/strict";
import test from "node:test";
import { buildCoursewareQualityReviewSummary } from "./courseware-quality-summary";
import type { CoursewareQualityReport } from "./courseware-quality";

const report: CoursewareQualityReport = {
  version: "courseware_quality_v1",
  score: 76,
  passedRequired: false,
  generatedAt: "2026-06-17T00:00:00.000Z",
  checks: [
    {
      id: "complete-example",
      label: "完整例题推导",
      severity: "required",
      passed: false,
      detail: "至少需要一个不少于 4 步的完整推导例题。",
    },
    {
      id: "html-rich-layout",
      label: "幻灯片版式丰富度",
      severity: "recommended",
      passed: false,
      detail: "建议至少使用 3 种不同版式。",
    },
    {
      id: "knowledge-trace",
      label: "知识点追踪",
      severity: "required",
      passed: true,
      detail: "已关联知识点。",
    },
  ],
};

test("buildCoursewareQualityReviewSummary separates required and recommended review items", () => {
  const summary = buildCoursewareQualityReviewSummary(report);

  assert.equal(summary.statusLabel, "仍需复核");
  assert.equal(summary.requiredItems.length, 1);
  assert.equal(summary.recommendedItems.length, 1);
  assert.equal(summary.requiredItems[0], "完整例题推导：至少需要一个不少于 4 步的完整推导例题。");
  assert.equal(summary.recommendedItems[0], "幻灯片版式丰富度：建议至少使用 3 种不同版式。");
});

test("buildCoursewareQualityReviewSummary returns a short passed summary", () => {
  const summary = buildCoursewareQualityReviewSummary({
    ...report,
    score: 100,
    passedRequired: true,
    checks: report.checks.map((check) => ({ ...check, passed: true })),
  });

  assert.equal(summary.statusLabel, "可进入人工确认");
  assert.deepEqual(summary.requiredItems, []);
  assert.deepEqual(summary.recommendedItems, []);
});
