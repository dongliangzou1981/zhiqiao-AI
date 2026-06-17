import assert from "node:assert/strict";
import test from "node:test";
import { getCoursewarePublishGuard } from "./courseware-publish-guard";
import type { CoursewareQualityReport } from "./courseware-quality";

const passingQuality: CoursewareQualityReport = {
  version: "courseware_quality_v1",
  score: 92,
  passedRequired: true,
  checks: [],
  generatedAt: "2026-06-17T00:00:00.000Z",
};

const failingQuality: CoursewareQualityReport = {
  ...passingQuality,
  score: 70,
  passedRequired: false,
};

test("getCoursewarePublishGuard allows unpublishing without quality confirmation", () => {
  const guard = getCoursewarePublishGuard({
    publishing: false,
    quality: failingQuality,
    teacherConfirmedRisk: false,
  });

  assert.equal(guard.canPublishChange, true);
});

test("getCoursewarePublishGuard blocks publishing when required checks fail and risk is not confirmed", () => {
  const guard = getCoursewarePublishGuard({
    publishing: true,
    quality: failingQuality,
    teacherConfirmedRisk: false,
  });

  assert.equal(guard.canPublishChange, false);
  assert.equal(guard.requiresRiskConfirmation, true);
});

test("getCoursewarePublishGuard allows publishing after teacher confirms quality risk", () => {
  const guard = getCoursewarePublishGuard({
    publishing: true,
    quality: failingQuality,
    teacherConfirmedRisk: true,
  });

  assert.equal(guard.canPublishChange, true);
});

test("getCoursewarePublishGuard allows publishing when required checks pass", () => {
  const guard = getCoursewarePublishGuard({
    publishing: true,
    quality: passingQuality,
    teacherConfirmedRisk: false,
  });

  assert.equal(guard.canPublishChange, true);
  assert.equal(guard.requiresRiskConfirmation, false);
});
