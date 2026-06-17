import assert from "node:assert/strict";
import test from "node:test";
import { buildCoursewareHumanReviewChecklist } from "./courseware-human-review";
import type { CoursewareQualityReport } from "./courseware-quality";

const report: CoursewareQualityReport = {
  version: "courseware_quality_v1",
  score: 80,
  passedRequired: false,
  generatedAt: "2026-06-17T00:00:00.000Z",
  checks: [
    {
      id: "complete-example",
      label: "完整例题推导",
      passed: false,
      severity: "required",
      detail: "缺少完整例题。",
    },
    {
      id: "html-projection",
      label: "投屏展示",
      passed: true,
      severity: "required",
      detail: "已通过。",
    },
  ],
};

test("buildCoursewareHumanReviewChecklist always includes teacher-facing review dimensions", () => {
  const items = buildCoursewareHumanReviewChecklist(report);

  assert(items.some((item) => item.title === "数学内容正确性"));
  assert(items.some((item) => item.title === "推导过程完整性"));
  assert(items.some((item) => item.title === "课堂投屏可用性"));
  assert(items.some((item) => item.title === "学生课后复习可用性"));
});

test("buildCoursewareHumanReviewChecklist marks failed related checks as focus items", () => {
  const items = buildCoursewareHumanReviewChecklist(report);
  const derivation = items.find((item) => item.title === "推导过程完整性");

  assert.equal(derivation?.status, "重点复核");
  assert(derivation?.reason.includes("完整例题推导"));
});
