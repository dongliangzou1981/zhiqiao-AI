import assert from "node:assert/strict";
import test from "node:test";
import { getCoursewareRevisionApplyGuard } from "./courseware-revision-apply-guard";
import type { CoursewareQualityReport } from "./courseware-quality";

const passedReport: CoursewareQualityReport = {
  version: "courseware_quality_v1",
  score: 94,
  passedRequired: true,
  generatedAt: "2026-06-17T00:00:00.000Z",
  checks: [],
};

const failedReport: CoursewareQualityReport = {
  ...passedReport,
  score: 72,
  passedRequired: false,
  checks: [
    {
      id: "complete-example",
      label: "完整例题推导",
      passed: false,
      severity: "required",
      detail: "缺少完整推导。",
    },
  ],
};

test("getCoursewareRevisionApplyGuard allows applying when required checks pass", () => {
  const guard = getCoursewareRevisionApplyGuard(passedReport, false);

  assert.equal(guard.canApply, true);
  assert.equal(guard.requiresRiskConfirmation, false);
});

test("getCoursewareRevisionApplyGuard requires confirmation when required checks fail", () => {
  const guard = getCoursewareRevisionApplyGuard(failedReport, false);

  assert.equal(guard.canApply, false);
  assert.equal(guard.requiresRiskConfirmation, true);
  assert.equal(guard.message, "优化版仍有必选质量项未通过，请先复核后再采用。");
});

test("getCoursewareRevisionApplyGuard allows applying after teacher confirms risk", () => {
  const guard = getCoursewareRevisionApplyGuard(failedReport, true);

  assert.equal(guard.canApply, true);
  assert.equal(guard.requiresRiskConfirmation, true);
});
